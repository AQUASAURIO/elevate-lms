'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  ScrollText,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';

const mockLogs = [
  { id: '1', userId: '1', user: { firstName: 'Admin', lastName: 'User' }, action: 'UPDATE', entity: 'User', entityId: 'u3', details: 'Changed role from STUDENT to PROFESSOR', ipAddress: '192.168.1.1', createdAt: '2025-02-12T14:30:00Z' },
  { id: '2', userId: null, user: null, action: 'SYSTEM', entity: 'System', entityId: null, details: 'Daily backup completed successfully', ipAddress: null, createdAt: '2025-02-12T12:00:00Z' },
  { id: '3', userId: '2', user: { firstName: 'John', lastName: 'Smith' }, action: 'CREATE', entity: 'Course', entityId: 'c10', details: 'Created new course "Advanced Algorithms"', ipAddress: '10.0.0.5', createdAt: '2025-02-12T10:15:00Z' },
  { id: '4', userId: '1', user: { firstName: 'Admin', lastName: 'User' }, action: 'LOGIN', entity: 'Auth', entityId: null, details: 'Admin login from Chrome on macOS', ipAddress: '192.168.1.1', createdAt: '2025-02-12T09:00:00Z' },
  { id: '5', userId: '3', user: { firstName: 'Alice', lastName: 'Johnson' }, action: 'ENROLL', entity: 'Enrollment', entityId: 'e50', details: 'Enrolled in Machine Learning 101', ipAddress: '172.16.0.10', createdAt: '2025-02-11T16:30:00Z' },
  { id: '6', userId: '4', user: { firstName: 'Bob', lastName: 'Williams' }, action: 'SUBMIT', entity: 'Submission', entityId: 's23', details: 'Submitted assignment "Binary Tree Implementation"', ipAddress: '172.16.0.11', createdAt: '2025-02-11T14:20:00Z' },
  { id: '7', userId: '2', user: { firstName: 'John', lastName: 'Smith' }, action: 'GRADE', entity: 'Submission', entityId: 's20', details: 'Graded submission: 95/100', ipAddress: '10.0.0.5', createdAt: '2025-02-11T11:00:00Z' },
  { id: '8', userId: '5', user: { firstName: 'Carol', lastName: 'Brown' }, action: 'LOGIN', entity: 'Auth', entityId: null, details: 'Failed login attempt (2/5)', ipAddress: '172.16.0.12', createdAt: '2025-02-10T20:15:00Z' },
  { id: '9', userId: null, user: null, action: 'SYSTEM', entity: 'System', entityId: null, details: 'Certificate renewal completed', ipAddress: null, createdAt: '2025-02-10T03:00:00Z' },
  { id: '10', userId: '1', user: { firstName: 'Admin', lastName: 'User' }, action: 'CREATE', entity: 'Announcement', entityId: 'a5', details: 'Published system maintenance announcement', ipAddress: '192.168.1.1', createdAt: '2025-02-10T10:00:00Z' },
];

const actionColors: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  UPDATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  LOGIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ENROLL: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  SUBMIT: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  GRADE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  SYSTEM: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export function AdminAuditPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return mockLogs.filter((log) => {
      const matchesSearch =
        !search ||
        log.details?.toLowerCase().includes(search.toLowerCase()) ||
        log.user?.firstName.toLowerCase().includes(search.toLowerCase()) ||
        log.user?.lastName.toLowerCase().includes(search.toLowerCase());
      const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
      const matchesEntity = entityFilter === 'ALL' || log.entity === entityFilter;
      return matchesSearch && matchesAction && matchesEntity;
    });
  }, [search, actionFilter, entityFilter]);

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'User', 'Action', 'Entity', 'Details', 'IP Address'].join(','),
      ...filteredLogs.map((log) =>
        [
          log.createdAt,
          log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
          log.action,
          log.entity,
          `"${log.details || ''}"`,
          log.ipAddress || 'N/A',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Audit logs exported successfully');
  };

  const actions = [...new Set(mockLogs.map((l) => l.action))];
  const entities = [...new Set(mockLogs.map((l) => l.entity))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Review system activity and security events</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Actions</SelectItem>
            {actions.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Entities</SelectItem>
            {entities.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44">Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="hidden md:table-cell">Entity</TableHead>
                  <TableHead className="hidden lg:table-cell">Details</TableHead>
                  <TableHead className="hidden lg:table-cell">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : (
                        <Badge variant="outline" className="text-[10px]">System</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] px-1.5 py-0 ${actionColors[log.action] || ''}`}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{log.entity}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-xs truncate">
                      {log.details}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-mono">
                      {log.ipAddress || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <ScrollText className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No audit logs found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing {filteredLogs.length} of {mockLogs.length} entries</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8">1</Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
