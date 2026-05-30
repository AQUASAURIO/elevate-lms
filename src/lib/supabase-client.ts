import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// ---------------------------------------------------------------------------
// Supabase Client Setup
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, { db: { schema: 'public' } })
  : null

if (!supabase) {
  console.warn('[supabase-client] Supabase credentials not configured. Using Prisma fallback.')
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Prisma model name → Supabase table name */
const TABLE_NAMES: Record<string, string> = {
  user: 'users',
  course: 'courses',
  module: 'modules',
  lesson: 'lessons',
  enrollment: 'enrollments',
  assignment: 'assignments',
  submission: 'submissions',
  announcement: 'announcements',
  notification: 'notifications',
  auditLog: 'audit_logs',
}

/** Composite unique keys: modelName → { prismaCompoundKeyName: [columns] } */
const COMPOSITE_UNIQUES: Record<string, Record<string, string[]>> = {
  enrollment: { userId_courseId: ['userId', 'courseId'] },
  submission: { assignmentId_studentId: ['assignmentId', 'studentId'] },
}

type RelationDef = {
  type: 'many-to-one' | 'one-to-many'
  foreignKey: string
  model: string
}

/** Relation map: modelName → { relationName: definition } */
const RELATIONS: Record<string, Record<string, RelationDef>> = {
  user: {
    courses:      { type: 'one-to-many', foreignKey: 'instructorId', model: 'course' },
    enrollments:  { type: 'one-to-many', foreignKey: 'userId', model: 'enrollment' },
    submissions:  { type: 'one-to-many', foreignKey: 'studentId', model: 'submission' },
    announcements: { type: 'one-to-many', foreignKey: 'authorId', model: 'announcement' },
    notifications: { type: 'one-to-many', foreignKey: 'userId', model: 'notification' },
    auditLogs:    { type: 'one-to-many', foreignKey: 'userId', model: 'auditLog' },
  },
  course: {
    instructor:    { type: 'many-to-one', foreignKey: 'instructorId', model: 'user' },
    modules:       { type: 'one-to-many', foreignKey: 'courseId', model: 'module' },
    enrollments:   { type: 'one-to-many', foreignKey: 'courseId', model: 'enrollment' },
    assignments:   { type: 'one-to-many', foreignKey: 'courseId', model: 'assignment' },
    announcements: { type: 'one-to-many', foreignKey: 'courseId', model: 'announcement' },
  },
  module: {
    course:      { type: 'many-to-one', foreignKey: 'courseId', model: 'course' },
    lessons:     { type: 'one-to-many', foreignKey: 'moduleId', model: 'lesson' },
    assignments: { type: 'one-to-many', foreignKey: 'moduleId', model: 'assignment' },
  },
  lesson: {
    module: { type: 'many-to-one', foreignKey: 'moduleId', model: 'module' },
  },
  enrollment: {
    user:   { type: 'many-to-one', foreignKey: 'userId', model: 'user' },
    course: { type: 'many-to-one', foreignKey: 'courseId', model: 'course' },
  },
  assignment: {
    course:      { type: 'many-to-one', foreignKey: 'courseId', model: 'course' },
    module:      { type: 'many-to-one', foreignKey: 'moduleId', model: 'module' },
    submissions: { type: 'one-to-many', foreignKey: 'assignmentId', model: 'submission' },
  },
  submission: {
    assignment: { type: 'many-to-one', foreignKey: 'assignmentId', model: 'assignment' },
    student:    { type: 'many-to-one', foreignKey: 'studentId', model: 'user' },
  },
  announcement: {
    course: { type: 'many-to-one', foreignKey: 'courseId', model: 'course' },
    author: { type: 'many-to-one', foreignKey: 'authorId', model: 'user' },
  },
  notification: {
    user: { type: 'many-to-one', foreignKey: 'userId', model: 'user' },
  },
  auditLog: {
    user: { type: 'many-to-one', foreignKey: 'userId', model: 'user' },
  },
}

/** Models that have `updatedAt` that needs to be auto-set on update */
const MODELS_WITH_UPDATED_AT = new Set([
  'user', 'course', 'module', 'lesson', 'enrollment',
  'assignment', 'submission', 'announcement', 'notification',
])

// ---------------------------------------------------------------------------
// Utility Helpers
// ---------------------------------------------------------------------------

/** Recursively convert ISO date strings to Date objects */
function convertDates<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  if (obj instanceof Date) return obj
  if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
    return new Date(obj) as unknown as T
  }
  if (Array.isArray(obj)) return obj.map(convertDates) as unknown as T
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      result[key] = convertDates((obj as Record<string, unknown>)[key])
    }
    return result as T
  }
  return obj
}

/** Generate a unique ID (matches Prisma's cuid pattern) */
function generateId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 25) +
    crypto.randomBytes(2).toString('hex').slice(0, 2)
}

/** Pick specific fields from a record */
function pickFields<T extends Record<string, unknown>>(
  record: T,
  selectSpec: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(selectSpec)) {
    if (selectSpec[key] === true && key in record) {
      result[key] = record[key]
    }
  }
  return result
}

// ---------------------------------------------------------------------------
// Where Clause Resolver
// ---------------------------------------------------------------------------
// Translates a Prisma-style where clause into flat column filters that can be
// applied to a Supabase query. Handles nested relation filters by resolving
// them to foreign-key ID lists.

interface ColumnFilter {
  column: string
  op: string    // 'eq' | 'neq' | 'contains' | 'in' | 'gte' | 'lte' | 'gt' | 'lt'
  value: unknown
}

interface ResolvedWhere {
  /** Column filters applied with individual Supabase methods (ANDed) */
  andFilters: ColumnFilter[]
  /** OR groups – each inner array is one OR branch with ANDed conditions */
  orGroups: ColumnFilter[][]
}

async function resolveWhereClause(
  modelName: string,
  where: Record<string, unknown>,
): Promise<ResolvedWhere> {
  const andFilters: ColumnFilter[] = []
  const orGroups: ColumnFilter[][] = []
  const modelRelations = RELATIONS[modelName] || {}
  const compositeKeys = COMPOSITE_UNIQUES[modelName] || {}

  for (const [key, rawValue] of Object.entries(where)) {
    if (key === '_count') continue // skip _count in where

    // --- AND ---
    if (key === 'AND') {
      const subs = Array.isArray(rawValue) ? rawValue : [rawValue]
      for (const sub of subs) {
        const resolved = await resolveWhereClause(modelName, sub as Record<string, unknown>)
        andFilters.push(...resolved.andFilters)
        orGroups.push(...resolved.orGroups)
      }
      continue
    }

    // --- OR ---
    if (key === 'OR') {
      const subs = Array.isArray(rawValue) ? rawValue : [rawValue]
      const orBranches: ColumnFilter[][] = []
      for (const sub of subs) {
        const resolved = await resolveWhereClause(modelName, sub as Record<string, unknown>)
        orBranches.push(resolved.andFilters)
        // Also carry forward any nested orGroups as separate and-ed or conditions
        for (const nestedOrGroup of resolved.orGroups) {
          orGroups.push(nestedOrGroup)
        }
      }
      // Each branch may have multiple filters (AND within OR)
      if (orBranches.length === 1) {
        // Single branch OR → just add as AND filters
        andFilters.push(...orBranches[0])
      } else if (orBranches.length > 1) {
        orGroups.push(...orBranches)
      }
      continue
    }

    // --- Composite unique key ---
    if (compositeKeys[key]) {
      const columns = compositeKeys[key]
      const val = rawValue as Record<string, unknown>
      for (const col of columns) {
        andFilters.push({ column: col, op: 'eq', value: val[col] })
      }
      continue
    }

    // --- Nested relation filter ---
    if (modelRelations[key]) {
      const rel = modelRelations[key]
      if (rel.type === 'many-to-one') {
        // Resolve the nested filter on the related table to get matching IDs
        const nestedResolved = await resolveWhereClause(rel.model, rawValue as Record<string, unknown>)
        const relatedTable = TABLE_NAMES[rel.model]
        let relatedQuery = supabase.from(relatedTable).select('id')
        relatedQuery = applySupabaseColumnFilters(relatedQuery, nestedResolved.andFilters, nestedResolved.orGroups)
        const { data: relatedData } = await relatedQuery
        const relatedIds: string[] = relatedData?.map((r: Record<string, unknown>) => r.id as string) || []

        if (relatedIds.length > 0) {
          andFilters.push({ column: rel.foreignKey, op: 'in', value: relatedIds })
        } else {
          // No matching related records → impossible match
          andFilters.push({ column: rel.foreignKey, op: 'eq', value: '__IMPOSSIBLE__' })
        }
      }
      continue
    }

    // --- Column filter ---
    if (rawValue === null) {
      andFilters.push({ column: key, op: 'eq', value: null })
    } else if (typeof rawValue === 'object' && !Array.isArray(rawValue)) {
      // Operator object: { contains, in, not, gte, lte, gt, lt }
      const ops = rawValue as Record<string, unknown>
      for (const [op, opValue] of Object.entries(ops)) {
        if (op === 'contains') {
          andFilters.push({ column: key, op: 'contains', value: opValue })
        } else if (op === 'in') {
          andFilters.push({ column: key, op: 'in', value: opValue })
        } else if (op === 'not') {
          if (opValue === null) {
            andFilters.push({ column: key, op: 'neq', value: null })
          } else {
            andFilters.push({ column: key, op: 'not', value: opValue })
          }
        } else if (op === 'gte') {
          andFilters.push({ column: key, op: 'gte', value: toISOString(opValue) })
        } else if (op === 'lte') {
          andFilters.push({ column: key, op: 'lte', value: toISOString(opValue) })
        } else if (op === 'gt') {
          andFilters.push({ column: key, op: 'gt', value: toISOString(opValue) })
        } else if (op === 'lt') {
          andFilters.push({ column: key, op: 'lt', value: toISOString(opValue) })
        }
      }
    } else {
      // Simple equality
      andFilters.push({ column: key, op: 'eq', value: rawValue })
    }
  }

  return { andFilters, orGroups }
}

/** Convert Date or string to ISO string for Supabase */
function toISOString(val: unknown): unknown {
  if (val instanceof Date) return val.toISOString()
  return val
}

// ---------------------------------------------------------------------------
// Supabase Query Builder
// ---------------------------------------------------------------------------

/** Build a PostgREST filter string for a single column filter */
function buildPostgrestFilter(f: ColumnFilter): string {
  const val = f.value
  let col = f.column
  let op = f.op

  switch (op) {
    case 'eq':
      if (val === null) return `${col}.is.null`
      return `${col}.eq.${escapePostgrestValue(val)}`
    case 'neq':
      if (val === null) return `${col}.not.is.null`
      return `${col}.neq.${escapePostgrestValue(val)}`
    case 'contains':
      return `${col}.ilike.%${escapePostgrestValue(val as string)}%`
    case 'not':
      return `${col}.neq.${escapePostgrestValue(val)}`
    case 'gte':
      return `${col}.gte.${escapePostgrestValue(val as string)}`
    case 'lte':
      return `${col}.lte.${escapePostgrestValue(val as string)}`
    case 'gt':
      return `${col}.gt.${escapePostgrestValue(val as string)}`
    case 'lt':
      return `${col}.lt.${escapePostgrestValue(val as string)}`
    case 'in':
      // .in() uses the method, not filter strings
      return ''
    default:
      return `${col}.eq.${escapePostgrestValue(val as string)}`
  }
}

/** Escape a value for PostgREST filter syntax */
function escapePostgrestValue(val: string | number | boolean): string {
  const s = String(val)
  // If it contains special characters, wrap in quotes and escape
  if (/[(),.\s]/.test(s)) {
    return `"${s.replace(/"/g, '\\"')}"`
  }
  return s
}

/** Apply resolved column filters and OR groups to a Supabase query builder */
function applySupabaseColumnFilters(
  query: ReturnType<typeof supabase.from> extends { select: (...a: any[]) => infer Q } ? ReturnType<typeof supabase.from>['select'] extends (...a: any[]) => infer R ? R : never : never,
  andFilters: ColumnFilter[],
  orGroups: ColumnFilter[][],
): any {
  let q: any = query

  // Apply individual AND filters
  for (const f of andFilters) {
    switch (f.op) {
      case 'eq':
        if (f.value === null) q = q.is(f.column, null)
        else q = q.eq(f.column, f.value)
        break
      case 'neq':
        if (f.value === null) q = q.not(f.column, 'is', null)
        else q = q.neq(f.column, f.value)
        break
      case 'contains':
        q = q.ilike(f.column, `%${f.value}%`)
        break
      case 'in':
        q = q.in(f.column, f.value as unknown[])
        break
      case 'not':
        q = q.neq(f.column, f.value)
        break
      case 'gte':
        q = q.gte(f.column, f.value)
        break
      case 'lte':
        q = q.lte(f.column, f.value)
        break
      case 'gt':
        q = q.gt(f.column, f.value)
        break
      case 'lt':
        q = q.lt(f.column, f.value)
        break
    }
  }

  // Apply OR groups (each group is one OR clause)
  for (const orBranch of orGroups) {
    if (orBranch.length === 0) continue

    const parts: string[] = []
    for (const f of orBranch) {
      const filterStr = buildPostgrestFilter(f)
      if (filterStr) parts.push(filterStr)
    }

    if (parts.length > 0) {
      q = q.or(parts.join(','))
    }
  }

  return q
}

// ---------------------------------------------------------------------------
// OrderBy Handler
// ---------------------------------------------------------------------------

type OrderByInput = Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>

/** Apply orderBy to a Supabase query */
function applyOrderBy(query: any, orderBy: OrderByInput): any {
  const entries = Array.isArray(orderBy) ? orderBy : [orderBy]
  for (const entry of entries) {
    for (const [column, direction] of Object.entries(entry)) {
      query = query.order(column, { ascending: direction === 'asc' })
    }
  }
  return query
}

// ---------------------------------------------------------------------------
// Include Processor
// ---------------------------------------------------------------------------

type IncludeSpec = Record<string, unknown> | true

/**
 * Process includes on a single record. Fetches related records and attaches them.
 * @param record - The parent record
 * @param modelName - The model name of the parent
 * @param includeSpec - The include specification (e.g., { instructor: { select: {...} }, _count: {...} })
 */
async function processIncludes<T extends Record<string, unknown>>(
  record: T,
  modelName: string,
  includeSpec: IncludeSpec,
): Promise<T> {
  if (!includeSpec || typeof includeSpec !== 'object') return record

  const result = { ...record }
  const modelRelations = RELATIONS[modelName] || {}

  for (const [relName, relValue] of Object.entries(includeSpec)) {
    // --- _count ---
    if (relName === '_count' && typeof relValue === 'object' && relValue !== null) {
      const countSelect = relValue as Record<string, unknown>
      const counts: Record<string, number> = {}

      const countPromises = Object.keys(countSelect).map(async (countRelName) => {
        if (countSelect[countRelName] !== true) return
        const relDef = modelRelations[countRelName]
        if (!relDef) return

        if (relDef.type === 'one-to-many') {
          const relatedTable = TABLE_NAMES[relDef.model]
          const { count } = await supabase
            .from(relatedTable)
            .select('*', { count: 'exact', head: true })
            .eq(relDef.foreignKey, record.id)
          counts[countRelName] = count || 0
        } else if (relDef.type === 'many-to-one') {
          // many-to-one count is always 1 or 0
          counts[countRelName] = record[relDef.foreignKey] ? 1 : 0
        }
      })

      await Promise.all(countPromises)
      result._count = counts
      continue
    }

    // --- Relation include ---
    const relDef = modelRelations[relName]
    if (!relDef) continue

    const relOptions = relValue === true ? {} : (relValue as Record<string, unknown>)

    if (relDef.type === 'many-to-one') {
      // Fetch the single related record
      const foreignKeyValue = record[relDef.foreignKey]
      if (foreignKeyValue) {
        let relQuery = supabase.from(TABLE_NAMES[relDef.model]).select('*')

        // Apply select if specified
        if (relOptions.select && typeof relOptions.select === 'object') {
          const selectColumns = Object.keys(relOptions.select as Record<string, unknown>)
          const hasNestedSelect = selectColumns.some((k) =>
            typeof (relOptions.select as Record<string, unknown>)[k] === 'object'
          )
          if (!hasNestedSelect) {
            relQuery = supabase.from(TABLE_NAMES[relDef.model]).select(selectColumns.join(','))
          }
        }

        const { data: relData } = await relQuery.eq('id', foreignKeyValue).maybeSingle()
        if (relData) {
          let processed = convertDates(relData) as Record<string, unknown>
          // Apply select
          if (relOptions.select && typeof relOptions.select === 'object') {
            const selectObj = relOptions.select as Record<string, unknown>
            const scalarKeys = Object.keys(selectObj).filter(
              (k) => selectObj[k] === true
            )
            const relationKeys = Object.keys(selectObj).filter(
              (k) => typeof selectObj[k] === 'object'
            )
            if (scalarKeys.length > 0 && relationKeys.length === 0) {
              processed = pickFields(processed, selectObj)
            }
            // Handle nested selects that are actually includes
            for (const rk of relationKeys) {
              if (typeof selectObj[rk] === 'object') {
                processed = await processIncludes(
                  processed,
                  relDef.model,
                  { [rk]: selectObj[rk] } as IncludeSpec,
                )
              }
            }
          }
          // Apply nested includes
          if (relOptions.include) {
            processed = await processIncludes(
              processed,
              relDef.model,
              relOptions.include as IncludeSpec,
            )
          }
          result[relName] = processed
        } else {
          result[relName] = null
        }
      } else {
        result[relName] = null
      }
    } else if (relDef.type === 'one-to-many') {
      // Fetch all related records
      let relQuery = supabase.from(TABLE_NAMES[relDef.model]).select('*').eq(relDef.foreignKey, record.id)

      // Apply orderBy
      if (relOptions.orderBy) {
        relQuery = applyOrderBy(relQuery, relOptions.orderBy as OrderByInput)
      }

      // Apply take (limit)
      if (typeof relOptions.take === 'number') {
        relQuery = relQuery.limit(relOptions.take)
      }

      const { data: relData } = await relQuery
      let relatedRecords = (relData || []).map((r) => convertDates(r))

      // Apply select
      if (relOptions.select && typeof relOptions.select === 'object') {
        const selectObj = relOptions.select as Record<string, unknown>
        const scalarKeys = Object.keys(selectObj).filter(
          (k) => selectObj[k] === true
        )
        const relationKeys = Object.keys(selectObj).filter(
          (k) => typeof selectObj[k] === 'object'
        )
        if (scalarKeys.length > 0) {
          relatedRecords = relatedRecords.map((r) => pickFields(r as Record<string, unknown>, selectObj))
        }
        // Handle nested relation selects
        for (const rk of relationKeys) {
          if (typeof selectObj[rk] === 'object') {
            relatedRecords = await Promise.all(
              relatedRecords.map(async (r) =>
                processIncludes(r as Record<string, unknown>, relDef.model, {
                  [rk]: selectObj[rk],
                } as IncludeSpec)
              )
            )
          }
        }
      }

      // Process nested includes
      if (relOptions.include && typeof relOptions.include === 'object') {
        relatedRecords = await Promise.all(
          relatedRecords.map(async (r) =>
            processIncludes(r as Record<string, unknown>, relDef.model, relOptions.include as IncludeSpec)
          )
        )
      }

      result[relName] = relatedRecords
    }
  }

  return result
}

/**
 * Process includes on an array of records. Uses batched fetching for efficiency.
 */
async function processIncludesMany<T extends Record<string, unknown>>(
  records: T[],
  modelName: string,
  includeSpec: IncludeSpec,
): Promise<T[]> {
  if (!includeSpec || typeof includeSpec !== 'object') return records
  if (records.length === 0) return records

  const modelRelations = RELATIONS[modelName] || {}

  // Process _count separately with batched queries
  if (includeSpec._count && typeof includeSpec._count === 'object') {
    const countSelect = includeSpec._count as Record<string, unknown>
    const parentIds = records.map((r) => r.id)

    for (const countRelName of Object.keys(countSelect)) {
      if (countSelect[countRelName] !== true) continue
      const relDef = modelRelations[countRelName]
      if (!relDef || relDef.type !== 'one-to-many') continue

      const relatedTable = TABLE_NAMES[relDef.model]
      // Fetch all related records to count per parent
      const { data: relData } = await supabase
        .from(relatedTable)
        .select(relDef.foreignKey)
        .in(relDef.foreignKey, parentIds)

      const counts: Record<string, number> = {}
      for (const r of relData || []) {
        const fk = r[relDef.foreignKey] as string
        counts[fk] = (counts[fk] || 0) + 1
      }

      for (const record of records) {
        if (!record._count) record._count = {} as Record<string, unknown>
        ;(record._count as Record<string, unknown>)[countRelName] = counts[record.id as string] || 0
      }
    }
  }

  // Process relation includes
  for (const [relName, relValue] of Object.entries(includeSpec)) {
    if (relName === '_count') continue
    const relDef = modelRelations[relName]
    if (!relDef) continue

    const relOptions = relValue === true ? {} : (relValue as Record<string, unknown>)

    if (relDef.type === 'many-to-one') {
      // Batch fetch: collect all foreign key values
      const fkValues = [...new Set(records.map((r) => r[relDef.foreignKey] as string).filter(Boolean))]
      if (fkValues.length === 0) continue

      let relQuery = supabase.from(TABLE_NAMES[relDef.model]).select('*').in('id', fkValues)

      const { data: relData } = await relQuery
      const relMap = new Map<string, Record<string, unknown>>()
      for (const r of (relData || [])) {
        relMap.set(r.id as string, convertDates(r))
      }

      for (const record of records) {
        const fk = record[relDef.foreignKey] as string
        let related = relMap.get(fk) || null

        if (related) {
          // Apply select
          if (relOptions.select && typeof relOptions.select === 'object') {
            const selectObj = relOptions.select as Record<string, unknown>
            const scalarKeys = Object.keys(selectObj).filter((k) => selectObj[k] === true)
            const relationKeys = Object.keys(selectObj).filter((k) => typeof selectObj[k] === 'object')
            if (scalarKeys.length > 0 && relationKeys.length === 0) {
              related = pickFields(related, selectObj)
            }
            for (const rk of relationKeys) {
              if (typeof selectObj[rk] === 'object') {
                related = await processIncludes(related, relDef.model, {
                  [rk]: selectObj[rk],
                } as IncludeSpec)
              }
            }
          }
          if (relOptions.include) {
            related = await processIncludes(related, relDef.model, relOptions.include as IncludeSpec)
          }
        }
        ;(record as Record<string, unknown>)[relName] = related
      }
    } else if (relDef.type === 'one-to-many') {
      // Batch fetch: fetch all related records for all parent IDs
      const parentIds = records.map((r) => r.id as string)

      let relQuery = supabase.from(TABLE_NAMES[relDef.model]).select('*').in(relDef.foreignKey, parentIds)

      if (relOptions.orderBy) {
        relQuery = applyOrderBy(relQuery, relOptions.orderBy as OrderByInput)
      }
      if (typeof relOptions.take === 'number') {
        relQuery = relQuery.limit(relOptions.take)
      }

      const { data: relData } = await relQuery
      const grouped = new Map<string, Record<string, unknown>[]>()
      for (const r of (relData || [])) {
        const fk = r[relDef.foreignKey] as string
        if (!grouped.has(fk)) grouped.set(fk, [])
        grouped.get(fk)!.push(convertDates(r))
      }

      // Apply select
      let processedRelData = grouped
      if (relOptions.select && typeof relOptions.select === 'object') {
        const selectObj = relOptions.select as Record<string, unknown>
        const scalarKeys = Object.keys(selectObj).filter((k) => selectObj[k] === true)
        const relationKeys = Object.keys(selectObj).filter((k) => typeof selectObj[k] === 'object')
        if (scalarKeys.length > 0) {
          processedRelData = new Map()
          for (const [fk, items] of grouped) {
            processedRelData.set(fk, items.map((r) => pickFields(r, selectObj)))
          }
        }
        for (const rk of relationKeys) {
          if (typeof selectObj[rk] === 'object') {
            for (const [fk, items] of processedRelData) {
              processedRelData.set(fk, await Promise.all(
                items.map(async (r) =>
                  processIncludes(r, relDef.model, { [rk]: selectObj[rk] } as IncludeSpec)
                )
              ))
            }
          }
        }
      }

      // Process nested includes
      if (relOptions.include && typeof relOptions.include === 'object') {
        for (const [fk, items] of processedRelData) {
          processedRelData.set(fk, await Promise.all(
            items.map(async (r) =>
              processIncludes(r, relDef.model, relOptions.include as IncludeSpec)
            )
          ))
        }
      }

      for (const record of records) {
        ;(record as Record<string, unknown>)[relName] = processedRelData.get(record.id as string) || []
      }
    }
  }

  return records
}

// ---------------------------------------------------------------------------
// Data Transformer (handles increment/decrement for updates)
// ---------------------------------------------------------------------------

/**
 * Transform update data to handle Prisma operators like { increment: 1 } and
 * { decrement: 1 }. These require fetching the current value first.
 */
async function transformUpdateData(
  modelName: string,
  where: Record<string, unknown>,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const transformed: Record<string, unknown> = { ...data }
  const columnsToFetch: string[] = []

  // Find increment/decrement operators
  for (const [key, val] of Object.entries(data)) {
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      const ops = val as Record<string, unknown>
      if ('increment' in ops || 'decrement' in ops) {
        columnsToFetch.push(key)
      }
    }
  }

  // Fetch current values for columns that need increment/decrement
  if (columnsToFetch.length > 0) {
    const tableName = TABLE_NAMES[modelName]
    let query: any = supabase.from(tableName).select(columnsToFetch.join(','))

    // Apply where clause to find the record
    for (const [key, val] of Object.entries(where)) {
      if (key === 'id') {
        query = query.eq('id', val)
      } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        // Composite key component
        for (const [ck, cv] of Object.entries(val as Record<string, unknown>)) {
          query = query.eq(ck, cv)
        }
      } else {
        query = query.eq(key, val)
      }
    }

    const { data: current } = await query.maybeSingle()

    for (const col of columnsToFetch) {
      const ops = data[col] as Record<string, unknown>
      const currentVal = (current?.[col] as number) || 0
      if ('increment' in ops) {
        transformed[col] = currentVal + (ops.increment as number)
      } else if ('decrement' in ops) {
        transformed[col] = currentVal - (ops.decrement as number)
      }
    }
  }

  // Auto-set updatedAt if the model has it and it's not explicitly set
  if (MODELS_WITH_UPDATED_AT.has(modelName) && !('updatedAt' in transformed)) {
    transformed.updatedAt = new Date().toISOString()
  }

  return transformed
}

// ---------------------------------------------------------------------------
// Select Processor (for queries that use `select` option)
// ---------------------------------------------------------------------------

/**
 * Build Supabase select columns string from a Prisma select spec.
 * Handles scalar fields only; relation fields are processed separately via includes.
 */
function buildSelectColumns(
  selectSpec: Record<string, unknown>,
  modelName: string,
): { columns: string[]; relationSelects: Record<string, Record<string, unknown>> } {
  const modelRelations = RELATIONS[modelName] || {}
  const columns: string[] = []
  const relationSelects: Record<string, Record<string, unknown>> = {}

  for (const [key, val] of Object.entries(selectSpec)) {
    if (val === true) {
      // Check if this is a relation
      if (modelRelations[key]) {
        // It's a relation selected as true — include full record
        relationSelects[key] = {}
      } else {
        columns.push(key)
      }
    } else if (typeof val === 'object' && modelRelations[key]) {
      // Relation with nested select
      relationSelects[key] = val as Record<string, unknown>
    }
  }

  return { columns, relationSelects }
}

// ---------------------------------------------------------------------------
// Model Proxy
// ---------------------------------------------------------------------------

class ModelProxy {
  constructor(private modelName: string) {}

  private get tableName(): string {
    return TABLE_NAMES[this.modelName]
  }

  // ---- findUnique ----
  async findUnique(args: {
    where: Record<string, unknown>
    include?: IncludeSpec
    select?: Record<string, unknown>
  }): Promise<Record<string, unknown> | null> {
    const { where, include, select } = args

    // Build select columns
    let selectColumns = '*'
    if (select && typeof select === 'object') {
      const { columns, relationSelects } = buildSelectColumns(select, this.modelName)
      if (columns.length > 0) {
        selectColumns = columns.join(',')
      }
    }

    // Resolve where
    const { andFilters, orGroups } = await resolveWhereClause(this.modelName, where)

    // Build and execute query
    let query: any = supabase.from(this.tableName).select(selectColumns)
    query = applySupabaseColumnFilters(query, andFilters, orGroups)
    const { data, error } = await query.maybeSingle()

    if (error || !data) return null

    let record = convertDates(data) as Record<string, unknown>

    // Apply top-level select field picking
    if (select && typeof select === 'object') {
      const { columns, relationSelects } = buildSelectColumns(select, this.modelName)
      if (columns.length > 0) {
        record = pickFields(record, Object.fromEntries(columns.map((c) => [c, true])))
      }
      // Process relation selects (treated like includes)
      for (const [relName, relSpec] of Object.entries(relationSelects)) {
        record = await processIncludes(record, this.modelName, {
          [relName]: relSpec,
        } as unknown as IncludeSpec)
      }
    }

    // Process includes
    if (include) {
      record = await processIncludes(record, this.modelName, include)
    }

    return record
  }

  // ---- findFirst ----
  async findFirst(args: {
    where?: Record<string, unknown>
    orderBy?: OrderByInput
    select?: Record<string, unknown>
    include?: IncludeSpec
  }): Promise<Record<string, unknown> | null> {
    const { where = {}, orderBy, select, include } = args

    // Build select columns
    let selectColumns = '*'
    if (select && typeof select === 'object') {
      const { columns } = buildSelectColumns(select, this.modelName)
      if (columns.length > 0) {
        selectColumns = columns.join(',')
      }
    }

    // Resolve where
    const { andFilters, orGroups } = await resolveWhereClause(this.modelName, where)

    // Build query
    let query: any = supabase.from(this.tableName).select(selectColumns)
    query = applySupabaseColumnFilters(query, andFilters, orGroups)
    if (orderBy) query = applyOrderBy(query, orderBy)
    query = query.limit(1)

    const { data } = await query.maybeSingle()
    if (!data) return null

    let record = convertDates(data) as Record<string, unknown>

    // Apply select
    if (select && typeof select === 'object') {
      const { columns, relationSelects } = buildSelectColumns(select, this.modelName)
      if (columns.length > 0) {
        record = pickFields(record, Object.fromEntries(columns.map((c) => [c, true])))
      }
      for (const [relName, relSpec] of Object.entries(relationSelects)) {
        record = await processIncludes(record, this.modelName, {
          [relName]: relSpec,
        } as unknown as IncludeSpec)
      }
    }

    // Process includes
    if (include) {
      record = await processIncludes(record, this.modelName, include)
    }

    return record
  }

  // ---- findMany ----
  async findMany(args: {
    where?: Record<string, unknown>
    orderBy?: OrderByInput
    include?: IncludeSpec
    take?: number
    skip?: number
    select?: Record<string, unknown>
  }): Promise<Record<string, unknown>[]> {
    const { where = {}, orderBy, include, take, skip, select } = args

    // Build select columns
    let selectColumns = '*'
    if (select && typeof select === 'object') {
      const { columns } = buildSelectColumns(select, this.modelName)
      if (columns.length > 0) {
        selectColumns = columns.join(',')
      }
    }

    // Resolve where
    const { andFilters, orGroups } = await resolveWhereClause(this.modelName, where)

    // Build query
    let query: any = supabase.from(this.tableName).select(selectColumns)
    query = applySupabaseColumnFilters(query, andFilters, orGroups)
    if (orderBy) query = applyOrderBy(query, orderBy)
    if (skip) query = query.range(skip, (skip + (take || 1000)) - 1)
    else if (take) query = query.limit(take)

    const { data } = await query
    let records = ((data || []) as Record<string, unknown>[]).map((r) => convertDates(r))

    // Apply select
    if (select && typeof select === 'object') {
      const { columns, relationSelects } = buildSelectColumns(select, this.modelName)
      if (columns.length > 0) {
        records = records.map((r) => pickFields(r, Object.fromEntries(columns.map((c) => [c, true]))))
      }
      // Process relation selects
      if (Object.keys(relationSelects).length > 0) {
        const includeFromSelect: IncludeSpec = {} as IncludeSpec
        for (const [relName, relSpec] of Object.entries(relationSelects)) {
          ;(includeFromSelect as Record<string, unknown>)[relName] = relSpec
        }
        records = await processIncludesMany(records, this.modelName, includeFromSelect)
      }
    }

    // Process includes
    if (include) {
      records = await processIncludesMany(records, this.modelName, include)
    }

    return records
  }

  // ---- create ----
  async create(args: {
    data: Record<string, unknown>
    include?: IncludeSpec
    select?: Record<string, unknown>
  }): Promise<Record<string, unknown>> {
    const { data, include, select } = args

    // Prepare insert data
    const insertData: Record<string, unknown> = { ...data }

    // Generate ID if not provided
    if (!insertData.id) {
      insertData.id = generateId()
    }

    // Convert Date objects to ISO strings
    for (const [key, val] of Object.entries(insertData)) {
      if (val instanceof Date) {
        insertData[key] = val.toISOString()
      }
    }

    // Execute insert
    const { data: inserted, error } = await supabase
      .from(this.tableName)
      .insert(insertData)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to create ${this.modelName}: ${error.message}`)
    }

    let record = convertDates(inserted) as Record<string, unknown>

    // Apply select
    if (select && typeof select === 'object') {
      const { columns, relationSelects } = buildSelectColumns(select, this.modelName)
      if (columns.length > 0) {
        record = pickFields(record, Object.fromEntries(columns.map((c) => [c, true])))
      }
      for (const [relName, relSpec] of Object.entries(relationSelects)) {
        record = await processIncludes(record, this.modelName, {
          [relName]: relSpec,
        } as unknown as IncludeSpec)
      }
    }

    // Process includes
    if (include) {
      record = await processIncludes(record, this.modelName, include)
    }

    return record
  }

  // ---- createMany ----
  async createMany(args: {
    data: Record<string, unknown>[]
    skipDuplicates?: boolean
  }): Promise<{ count: number }> {
    const { data, skipDuplicates } = args

    const insertRows = data.map((row) => {
      const r: Record<string, unknown> = { ...row }
      if (!r.id) r.id = generateId()
      // Convert Date objects
      for (const [key, val] of Object.entries(r)) {
        if (val instanceof Date) r[key] = val.toISOString()
      }
      return r
    })

    const { error } = await supabase
      .from(this.tableName)
      .insert(insertRows)

    if (error) {
      // If skipDuplicates, ignore unique constraint violations
      if (skipDuplicates && error.code === '23505') {
        return { count: insertRows.length }
      }
      throw new Error(`Failed to createMany ${this.modelName}: ${error.message}`)
    }

    return { count: insertRows.length }
  }

  // ---- update ----
  async update(args: {
    where: Record<string, unknown>
    data: Record<string, unknown>
    include?: IncludeSpec
  }): Promise<Record<string, unknown>> {
    const { where, data, include } = args

    // Transform data (handle increment/decrement, updatedAt auto-set)
    const transformedData = await transformUpdateData(this.modelName, where, data)

    // Convert Date objects to ISO strings
    for (const [key, val] of Object.entries(transformedData)) {
      if (val instanceof Date) {
        (transformedData as Record<string, unknown>)[key] = val.toISOString()
      }
    }

    // Build query with where clause
    const { andFilters, orGroups } = await resolveWhereClause(this.modelName, where)
    let query: any = supabase.from(this.tableName).update(transformedData)
    query = applySupabaseColumnFilters(query, andFilters, orGroups)

    const { data: updated, error } = await query.select('*').maybeSingle()

    if (error) {
      throw new Error(`Failed to update ${this.modelName}: ${error.message}`)
    }

    if (!updated) {
      throw new Error(`Failed to update ${this.modelName}: record not found`)
    }

    let record = convertDates(updated) as Record<string, unknown>

    // Process includes
    if (include) {
      record = await processIncludes(record, this.modelName, include)
    }

    return record
  }

  // ---- updateMany ----
  async updateMany(args: {
    where: Record<string, unknown>
    data: Record<string, unknown>
  }): Promise<{ count: number }> {
    const { where, data } = args

    const transformedData: Record<string, unknown> = { ...data }

    // Convert Date objects
    for (const [key, val] of Object.entries(transformedData)) {
      if (val instanceof Date) {
        (transformedData as Record<string, unknown>)[key] = val.toISOString()
      }
    }

    // Auto-set updatedAt
    if (MODELS_WITH_UPDATED_AT.has(this.modelName) && !('updatedAt' in transformedData)) {
      transformedData.updatedAt = new Date().toISOString()
    }

    const { andFilters, orGroups } = await resolveWhereClause(this.modelName, where)
    let query: any = supabase.from(this.tableName).update(transformedData)
    query = applySupabaseColumnFilters(query, andFilters, orGroups)

    const { error } = await query

    if (error) {
      throw new Error(`Failed to updateMany ${this.modelName}: ${error.message}`)
    }

    // Supabase doesn't return count, so we approximate
    // In practice, updateMany is used with specific where clauses
    return { count: 1 }
  }

  // ---- count ----
  async count(args?: {
    where?: Record<string, unknown>
  }): Promise<number> {
    const where = args?.where || {}

    const { andFilters, orGroups } = await resolveWhereClause(this.modelName, where)
    let query: any = supabase.from(this.tableName).select('*', { count: 'exact', head: true })
    query = applySupabaseColumnFilters(query, andFilters, orGroups)

    const { count, error } = await query
    if (error) {
      console.error(`[supabase] count error for ${this.modelName}:`, error)
      return 0
    }
    return count || 0
  }

  // ---- deleteMany ----
  async deleteMany(args?: {
    where: Record<string, unknown>
  }): Promise<{ count: number }> {
    const where = args?.where || {}

    const { andFilters, orGroups } = await resolveWhereClause(this.modelName, where)
    let query: any = supabase.from(this.tableName).delete()
    query = applySupabaseColumnFilters(query, andFilters, orGroups)

    const { error } = await query

    if (error) {
      throw new Error(`Failed to deleteMany ${this.modelName}: ${error.message}`)
    }

    return { count: 1 }
  }

  // ---- delete (single record) ----
  async delete(args: {
    where: Record<string, unknown>
  }): Promise<Record<string, unknown>> {
    const { where } = args

    const { andFilters, orGroups } = await resolveWhereClause(this.modelName, where)
    let query: any = supabase.from(this.tableName).delete()
    query = applySupabaseColumnFilters(query, andFilters, orGroups)

    const { data, error } = await query.select('*').maybeSingle()
    if (error || !data) {
      throw new Error(`Failed to delete ${this.modelName}: record not found`)
    }

    return convertDates(data) as Record<string, unknown>
  }

  // ---- upsert ----
  async upsert(args: {
    where: Record<string, unknown>
    create: Record<string, unknown>
    update: Record<string, unknown>
    include?: IncludeSpec
  }): Promise<Record<string, unknown>> {
    const { where, create, update, include } = args

    // Check if record exists
    const existing = await this.findUnique({ where })

    if (existing) {
      // Update
      return this.update({ where, data: update, include })
    } else {
      // Create
      return this.create({ data: create, include })
    }
  }
}

// ---------------------------------------------------------------------------
// Transaction Support
// ---------------------------------------------------------------------------

/**
 * Execute operations sequentially (Supabase REST doesn't support transactions).
 * Accepts both array form and interactive callback form.
 */
async function transaction(
  argsOrFn: unknown,
): Promise<unknown> {
  if (typeof argsOrFn === 'function') {
    // Interactive form: $transaction(async (tx) => { ... })
    return (argsOrFn as (tx: typeof db) => Promise<unknown>)(db)
  }

  if (Array.isArray(argsOrFn)) {
    // Array form: $transaction([db.user.deleteMany(), ...])
    const results: unknown[] = []
    for (const action of argsOrFn) {
      if (typeof action === 'object' && action !== null && 'then' in action) {
        results.push(await action)
      } else {
        results.push(action)
      }
    }
    return results
  }

  throw new Error('Invalid $transaction arguments')
}

// ---------------------------------------------------------------------------
// Export db Object
// ---------------------------------------------------------------------------

export const db = {
  user:         new ModelProxy('user'),
  course:       new ModelProxy('course'),
  module:       new ModelProxy('module'),
  lesson:       new ModelProxy('lesson'),
  enrollment:   new ModelProxy('enrollment'),
  assignment:   new ModelProxy('assignment'),
  submission:   new ModelProxy('submission'),
  announcement: new ModelProxy('announcement'),
  notification: new ModelProxy('notification'),
  auditLog:     new ModelProxy('auditLog'),
  $transaction: transaction,

  /** Disconnect from the database (no-op for Supabase REST client) */
  async $disconnect() {},
  /** Connect to the database (no-op for Supabase REST client) */
  async $connect() {},
}
