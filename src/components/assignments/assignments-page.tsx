'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/stores/app-store';
import { toast } from 'sonner';
import {
  ClipboardList,
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Star,
} from 'lucide-react';
import { format } from 'date-fns';

const mockAssignments = [
  {
    id: '1',
    title: 'Final Project - Full Stack App',
    description: 'Build a complete full-stack web application with authentication and database integration.',
    courseTitle: 'Web Development Fundamentals',
    courseCategory: 'Development',
    dueDate: '2025-02-20T23:59:00Z',
    maxScore: 100,
    status: 'PENDING' as const,
  },
  {
    id: '2',
    title: 'Binary Tree Implementation',
    description: 'Implement a binary search tree with insert, delete, search, and traversal operations.',
    courseTitle: 'Data Structures & Algorithms',
    courseCategory: 'Computer Science',
    dueDate: '2025-02-25T23:59:00Z',
    maxScore: 100,
    status: 'PENDING' as const,
  },
  {
    id: '3',
    title: 'Midterm Exam',
    description: 'Covering chapters 1-4: variables, data types, control flow, and functions.',
    courseTitle: 'Introduction to Computer Science',
    courseCategory: 'Computer Science',
    dueDate: '2025-02-18T23:59:00Z',
    maxScore: 100,
    status: 'SUBMITTED' as const,
  },
  {
    id: '4',
    title: 'Database Schema Design',
    description: 'Design a normalized database schema for a university management system.',
    courseTitle: 'Database Design & SQL',
    courseCategory: 'Computer Science',
    dueDate: '2025-02-15T23:59:00Z',
    maxScore: 100,
    status: 'SUBMITTED' as const,
  },
  {
    id: '5',
    title: 'Hello World Program',
    description: 'Write your first program in the language of your choice.',
    courseTitle: 'Introduction to Computer Science',
    courseCategory: 'Computer Science',
    dueDate: '2025-02-10T23:59:00Z',
    maxScore: 100,
    status: 'GRADED' as const,
    score: 95,
    feedback: 'Excellent work! Your code was clean and well-documented.',
  },
  {
    id: '6',
    title: 'Array Operations Quiz',
    description: 'Complete the quiz on array manipulation methods.',
    courseTitle: 'Introduction to Computer Science',
    courseCategory: 'Computer Science',
    dueDate: '2025-02-08T23:59:00Z',
    maxScore: 100,
    status: 'GRADED' as const,
    score: 88,
    feedback: 'Good understanding. Review the section on multi-dimensional arrays.',
  },
];

const statusConfig: Record<string, { badge: string; icon: React.ElementType; iconColor: string }> = {
  PENDING: { badge: 'outline', icon: AlertCircle, iconColor: 'text-amber-500' },
  SUBMITTED: { badge: 'secondary', icon: Clock, iconColor: 'text-blue-500' },
  GRADED: { badge: 'default', icon: CheckCircle2, iconColor: 'text-emerald-500' },
};

export function AssignmentsPage() {
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const navigate = useAppStore((s) => s.navigate);

  const pending = mockAssignments.filter((a) => a.status === 'PENDING');
  const submitted = mockAssignments.filter((a) => a.status === 'SUBMITTED');
  const graded = mockAssignments.filter((a) => a.status === 'GRADED');

  const handleOpenSubmit = (assignmentId: string) => {
    setSelectedAssignment(assignmentId);
    setSubmissionContent('');
    setSubmitDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!submissionContent.trim()) {
      toast.error('Please enter your submission content');
      return;
    }
    setSubmitDialogOpen(false);
    toast.success('Assignment submitted successfully!');
  };

  const renderAssignment = (assignment: typeof mockAssignments[0]) => {
    const config = statusConfig[assignment.status];
    const StatusIcon = config.icon;
    const isOverdue = assignment.status === 'PENDING' && new Date(assignment.dueDate) < new Date();

    return (
      <Card key={assignment.id} className="hover:bg-muted/30 transition-colors">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className={`mt-0.5 ${config.iconColor}`}>
                <StatusIcon className="h-5 w-5" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-medium">{assignment.title}</h4>
                  <Badge
                    variant={config.badge as 'default' | 'secondary' | 'outline'}
                    className={`text-[10px] px-1.5 py-0 ${
                      assignment.status === 'GRADED'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : ''
                    }`}
                  >
                    {assignment.status}
                  </Badge>
                  {isOverdue && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      Overdue
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{assignment.description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {assignment.courseTitle}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due: {format(new Date(assignment.dueDate), 'MMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {assignment.maxScore} pts
                  </span>
                </div>
                {assignment.status === 'GRADED' && assignment.feedback && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    Feedback: {assignment.feedback}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {assignment.status === 'GRADED' && (
                <div className="text-right mr-2">
                  <p className="text-lg font-bold text-primary">{assignment.score}/{assignment.maxScore}</p>
                </div>
              )}
              {assignment.status === 'PENDING' && (
                <Button size="sm" onClick={() => handleOpenSubmit(assignment.id)}>
                  <Send className="h-4 w-4 mr-1" />
                  Submit
                </Button>
              )}
              {(assignment.status === 'SUBMITTED' || assignment.status === 'GRADED') && (
                <Button size="sm" variant="outline" onClick={() => toast.info('Viewing submission...')}>
                  View
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Assignments</h1>
        <p className="text-muted-foreground mt-1">Track and submit your course assignments</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 text-[10px] px-1">
              {pending.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="submitted">
            Submitted
            <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 text-[10px] px-1">
              {submitted.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="graded">
            Graded
            <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 text-[10px] px-1">
              {graded.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-3">
          {pending.length > 0 ? pending.map(renderAssignment) : (
            <EmptyState icon={CheckCircle2} message="No pending assignments!" />
          )}
        </TabsContent>
        <TabsContent value="submitted" className="mt-4 space-y-3">
          {submitted.length > 0 ? submitted.map(renderAssignment) : (
            <EmptyState icon={ClipboardList} message="No submitted assignments." />
          )}
        </TabsContent>
        <TabsContent value="graded" className="mt-4 space-y-3">
          {graded.length > 0 ? graded.map(renderAssignment) : (
            <EmptyState icon={Star} message="No graded assignments yet." />
          )}
        </TabsContent>
      </Tabs>

      {/* Submit Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
            <DialogDescription>
              {selectedAssignment
                ? mockAssignments.find((a) => a.id === selectedAssignment)?.title
                : 'Submit your work'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Submission Content</label>
              <Textarea
                placeholder="Enter your submission content, paste your code, or describe your work..."
                rows={8}
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                className="scrollbar-thin"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              <Send className="h-4 w-4 mr-2" />
              Submit Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Icon className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
