'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/stores/app-store';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  FileText,
  Video,
  HelpCircle,
  ClipboardCheck,
  BookOpen,
} from 'lucide-react';

const courseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  level: z.string().min(1, 'Level is required'),
  maxStudents: z.coerce.number().min(1, 'Must have at least 1 student').optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface ModuleForm {
  id: string;
  title: string;
  description: string;
  lessons: LessonForm[];
}

interface LessonForm {
  id: string;
  title: string;
  content: string;
  type: string;
  videoUrl: string;
  durationMinutes: number;
}

const lessonTypeIcons: Record<string, React.ElementType> = {
  TEXT: FileText,
  VIDEO: Video,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardCheck,
};

let nextId = 100;
function genId() {
  return `temp-${++nextId}`;
}

export function CourseEditorPage() {
  const { courseEditorId, navigate } = useAppStore();
  const isEditing = !!courseEditorId;

  const [modules, setModules] = useState<ModuleForm[]>([
    {
      id: genId(),
      title: 'Module 1: Getting Started',
      description: 'Introduction to the course',
      lessons: [
        { id: genId(), title: 'Welcome', content: 'Course introduction...', type: 'TEXT', videoUrl: '', durationMinutes: 10 },
      ],
    },
  ]);

  const [activeModule, setActiveModule] = useState<string | null>(modules[0]?.id || null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: isEditing ? 'Introduction to Computer Science' : '',
      description: isEditing ? 'Learn the fundamentals of computer science including algorithms, data structures, and programming concepts.' : '',
      category: isEditing ? 'Computer Science' : '',
      level: isEditing ? 'BEGINNER' : 'BEGINNER',
      maxStudents: isEditing ? 100 : undefined,
    },
  });

  const onSubmit = async (data: CourseFormData) => {
    // Validate modules
    if (modules.length === 0) {
      toast.error('Please add at least one module');
      return;
    }

    // Simulate save
    toast.success(isEditing ? 'Course updated successfully!' : 'Course created successfully!');
    navigate('courses');
  };

  const handleSaveDraft = () => {
    toast.success('Draft saved successfully!');
  };

  // Module operations
  const addModule = () => {
    const newModule: ModuleForm = {
      id: genId(),
      title: `Module ${modules.length + 1}`,
      description: '',
      lessons: [],
    };
    setModules([...modules, newModule]);
    setActiveModule(newModule.id);
  };

  const removeModule = (moduleId: string) => {
    setModules(modules.filter((m) => m.id !== moduleId));
    if (activeModule === moduleId) {
      setActiveModule(modules[0]?.id || null);
    }
  };

  const updateModule = (moduleId: string, field: string, value: string) => {
    setModules(modules.map((m) => (m.id === moduleId ? { ...m, [field]: value } : m)));
  };

  const moveModule = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === modules.length - 1)) return;
    const newModules = [...modules];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newModules[index], newModules[swapIndex]] = [newModules[swapIndex], newModules[index]];
    setModules(newModules);
  };

  // Lesson operations
  const addLesson = (moduleId: string) => {
    setModules(
      modules.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              lessons: [
                ...m.lessons,
                { id: genId(), title: 'New Lesson', content: '', type: 'TEXT', videoUrl: '', durationMinutes: 15 },
              ],
            }
          : m
      )
    );
  };

  const removeLesson = (moduleId: string, lessonId: string) => {
    setModules(
      modules.map((m) =>
        m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m
      )
    );
  };

  const updateLesson = (moduleId: string, lessonId: string, field: string, value: string | number) => {
    setModules(
      modules.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, [field]: value } : l)) }
          : m
      )
    );
  };

  const moveLesson = (moduleId: string, index: number, direction: 'up' | 'down') => {
    const mod = modules.find((m) => m.id === moduleId);
    if (!mod) return;
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === mod.lessons.length - 1)) return;
    const newLessons = [...mod.lessons];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newLessons[index], newLessons[swapIndex]] = [newLessons[swapIndex], newLessons[index]];
    setModules(modules.map((m) => (m.id === moduleId ? { ...m, lessons: newLessons } : m)));
  };

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('courses')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? 'Edit Course' : 'Create New Course'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {modules.length} modules &middot; {totalLessons} lessons
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button variant="outline" onClick={() => toast.info('Preview coming soon...')}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSubmit(onSubmit)}>
            <Send className="h-4 w-4 mr-2" />
            {isEditing ? 'Update' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Course Details</CardTitle>
              <CardDescription>Basic information about your course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Introduction to Computer Science"
                  {...register('title')}
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what students will learn..."
                  rows={4}
                  {...register('description')}
                  className={errors.description ? 'border-destructive' : ''}
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={watch('category')} onValueChange={(v) => setValue('category', v)}>
                    <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Artificial Intelligence">Artificial Intelligence</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select value={watch('level')} onValueChange={(v) => setValue('level', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEGINNER">Beginner</SelectItem>
                      <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                      <SelectItem value="ADVANCED">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxStudents">Max Students</Label>
                  <Input
                    id="maxStudents"
                    type="number"
                    placeholder="Unlimited"
                    {...register('maxStudents')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modules */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Course Content</CardTitle>
                  <CardDescription>Organize your course into modules and lessons</CardDescription>
                </div>
                <Button size="sm" onClick={addModule}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Module
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {modules.map((mod, modIndex) => (
                <div
                  key={mod.id}
                  className={`rounded-lg border p-4 transition-colors cursor-pointer ${
                    activeModule === mod.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setActiveModule(mod.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <span className="text-xs text-muted-foreground font-medium">Module {modIndex + 1}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveModule(modIndex, 'up');
                        }}
                        disabled={modIndex === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveModule(modIndex, 'down');
                        }}
                        disabled={modIndex === modules.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeModule(mod.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Input
                    value={mod.title}
                    onChange={(e) => updateModule(mod.id, 'title', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium mb-1"
                    placeholder="Module title"
                  />
                  <Input
                    value={mod.description}
                    onChange={(e) => updateModule(mod.id, 'description', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm"
                    placeholder="Module description (optional)"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {mod.lessons.length} lessons
                    </Badge>
                  </div>

                  {/* Lessons */}
                  {activeModule === mod.id && mod.lessons.length > 0 && (
                    <div className="mt-3 space-y-2 border-t pt-3">
                      {mod.lessons.map((lesson, lessonIndex) => {
                        const Icon = lessonTypeIcons[lesson.type] || FileText;
                        return (
                          <div key={lesson.id} className="flex items-center gap-2 rounded-md border bg-background p-2.5">
                            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <Input
                              value={lesson.title}
                              onChange={(e) => updateLesson(mod.id, lesson.id, 'title', e.target.value)}
                              className="text-sm h-8"
                              placeholder="Lesson title"
                            />
                            <Select
                              value={lesson.type}
                              onValueChange={(v) => updateLesson(mod.id, lesson.id, 'type', v)}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="TEXT">Text</SelectItem>
                                <SelectItem value="VIDEO">Video</SelectItem>
                                <SelectItem value="QUIZ">Quiz</SelectItem>
                                <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => moveLesson(mod.id, lessonIndex, 'up')}
                              disabled={lessonIndex === 0}
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => moveLesson(mod.id, lessonIndex, 'down')}
                              disabled={lessonIndex === mod.lessons.length - 1}
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                              onClick={() => removeLesson(mod.id, lesson.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {activeModule === mod.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        addLesson(mod.id);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Lesson
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Course Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Modules</span>
                <span className="font-medium">{modules.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lessons</span>
                <span className="font-medium">{totalLessons}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline">Draft</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
