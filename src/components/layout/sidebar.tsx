'use client';

import { GraduationCap, LayoutDashboard, BookOpen, Users, FileText, Megaphone, Bell, User, ClipboardList, ScrollText } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from 'next-themes';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Moon,
  Sun,
  LogOut,
  Settings,
  ChevronDown,
  Palette,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const navItems = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'courses' as const, label: 'Browse Courses', icon: BookOpen },
  { id: 'my-courses' as const, label: 'My Courses', icon: GraduationCap },
  { id: 'assignments' as const, label: 'Assignments', icon: ClipboardList },
  { id: 'announcements' as const, label: 'Announcements', icon: Megaphone },
  { id: 'notifications' as const, label: 'Notifications', icon: Bell },
];

const professorItems = [
  { id: 'course-editor' as const, label: 'Course Management', icon: FileText },
];

const adminItems = [
  { id: 'course-editor' as const, label: 'Course Management', icon: FileText },
  { id: 'admin-users' as const, label: 'User Management', icon: Users },
  { id: 'admin-audit' as const, label: 'Audit Logs', icon: ScrollText },
];

export function AppSidebar() {
  const { currentPage, navigate } = useAppStore();
  const { user, logout } = useAuthStore();
  const { setTheme, theme } = useTheme();

  const userRole = user?.role || 'STUDENT';
  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  const isProfessor = userRole === 'PROFESSOR';

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : 'U';

  const unreadCount = Math.floor(Math.random() * 5); // placeholder

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-3 overflow-hidden justify-center">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150" />
            <Image src="/logo.png" alt="Elévate" width={44} height={44} className="relative rounded-xl drop-shadow-md" priority />
          </div>
          <span className="text-xl font-bold tracking-tight whitespace-nowrap group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 transition-[opacity,width] duration-200">
            <span className="bg-gradient-to-r from-[oklch(0.52_0.14_240)] to-[oklch(0.72_0.12_215)] bg-clip-text text-transparent">Elévate</span>
          </span>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-3">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={
                      item.id === currentPage ||
                      (item.id === 'my-courses' && currentPage === 'my-courses')
                    }
                    tooltip={item.label}
                    onClick={() => navigate(item.id)}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    <span>{item.label}</span>
                    {item.id === 'notifications' && unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-auto h-5 min-w-5 text-[10px] px-1">
                        {unreadCount}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Professor/Admin items */}
        {(isProfessor || isAdmin) && (
          <SidebarGroup>
            <SidebarGroupLabel>{isAdmin ? 'Administration' : 'Teaching'}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {(isAdmin ? adminItems : professorItems).map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={item.id === currentPage}
                      tooltip={item.label}
                      onClick={() => navigate(item.id)}
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  tooltip={user ? `${user.firstName} ${user.lastName}` : 'User'}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={user?.avatar || undefined} alt={user?.firstName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 leading-none overflow-hidden group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 transition-[opacity,width] duration-200">
                    <span className="font-medium text-sm whitespace-nowrap">
                      {user ? `${user.firstName} ${user.lastName}` : 'User'}
                    </span>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {userRole.replace('_', ' ')}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={() => navigate('profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('profile', { tab: 'appearance' })}>
                  <Palette className="mr-2 h-4 w-4" />
                  Appearance
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
