'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Shield,
  MoreHorizontal,
  UserCheck,
  UserX,
  Edit,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

const mockUsers = [
  { id: '1', firstName: 'John', lastName: 'Smith', email: 'john.smith@example.com', role: 'PROFESSOR', isActive: true, lastLoginAt: '2025-02-12T14:30:00Z', avatar: null, _count: { courses: 4 } },
  { id: '2', firstName: 'Jane', lastName: 'Doe', email: 'jane.doe@example.com', role: 'PROFESSOR', isActive: true, lastLoginAt: '2025-02-11T10:00:00Z', avatar: null, _count: { courses: 3 } },
  { id: '3', firstName: 'Alice', lastName: 'Johnson', email: 'alice@example.com', role: 'STUDENT', isActive: true, lastLoginAt: '2025-02-12T09:15:00Z', avatar: null, _count: { courses: 5 } },
  { id: '4', firstName: 'Bob', lastName: 'Williams', email: 'bob@example.com', role: 'STUDENT', isActive: true, lastLoginAt: '2025-02-10T16:45:00Z', avatar: null, _count: { courses: 3 } },
  { id: '5', firstName: 'Carol', lastName: 'Brown', email: 'carol@example.com', role: 'STUDENT', isActive: false, lastLoginAt: '2025-01-20T08:00:00Z', avatar: null, _count: { courses: 2 } },
  { id: '6', firstName: 'David', lastName: 'Davis', email: 'david@example.com', role: 'STUDENT', isActive: true, lastLoginAt: '2025-02-12T11:30:00Z', avatar: null, _count: { courses: 4 } },
  { id: '7', firstName: 'Eve', lastName: 'Miller', email: 'eve@example.com', role: 'STUDENT', isActive: true, lastLoginAt: '2025-02-09T14:00:00Z', avatar: null, _count: { courses: 3 } },
  { id: '8', firstName: 'Frank', lastName: 'Wilson', email: 'frank@example.com', role: 'STUDENT', isActive: true, lastLoginAt: '2025-02-11T15:20:00Z', avatar: null, _count: { courses: 2 } },
  { id: '9', firstName: 'Grace', lastName: 'Moore', email: 'grace@example.com', role: 'STUDENT', isActive: true, lastLoginAt: '2025-02-12T08:45:00Z', avatar: null, _count: { courses: 5 } },
  { id: '10', firstName: 'Henry', lastName: 'Taylor', email: 'henry@example.com', role: 'STUDENT', isActive: false, lastLoginAt: '2025-01-15T10:00:00Z', avatar: null, _count: { courses: 1 } },
];

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ADMIN: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  PROFESSOR: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  STUDENT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('');

  const filteredUsers = useMemo(() => {
    return mockUsers.filter((user) => {
      const matchesSearch =
        !search ||
        user.firstName.toLowerCase().includes(search.toLowerCase()) ||
        user.lastName.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [search, roleFilter]);

  const handleRoleChange = () => {
    if (!selectedUser || !newRole) return;
    const user = mockUsers.find((u) => u.id === selectedUser);
    toast.success(`Changed ${user?.firstName} ${user?.lastName}'s role to ${newRole.replace('_', ' ')}`);
    setRoleDialogOpen(false);
  };

  const toggleActive = (userId: string) => {
    const user = mockUsers.find((u) => u.id === userId);
    toast.success(`${user?.isActive ? 'Deactivated' : 'Activated'} ${user?.firstName} ${user?.lastName}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage users, roles, and permissions</p>
        </div>
        <Button variant="outline" onClick={() => toast.info('CSV export coming soon...')}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="STUDENT">Students</SelectItem>
            <SelectItem value="PROFESSOR">Professors</SelectItem>
            <SelectItem value="ADMIN">Admins</SelectItem>
            <SelectItem value="SUPER_ADMIN">Super Admins</SelectItem>
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
                  <TableHead className="w-12">User</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Login</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="group">
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-muted-foreground md:hidden">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] px-1.5 py-0 ${roleColors[user.role]}`}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant={user.isActive ? 'outline' : 'destructive'} className="text-[10px] px-1.5 py-0">
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {user.lastLoginAt ? format(new Date(user.lastLoginAt), 'MMM d, HH:mm') : 'Never'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user.id);
                              setNewRole(user.role);
                              setRoleDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleActive(user.id)}>
                            {user.isActive ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No users found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing {filteredUsers.length} of {mockUsers.length} users</p>
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

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {mockUsers.find((u) => u.id === selectedUser)?.firstName}{' '}
              {mockUsers.find((u) => u.id === selectedUser)?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="PROFESSOR">Professor</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRoleChange}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
