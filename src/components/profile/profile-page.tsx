'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import { Loader2, User, Mail, Shield, Calendar, Clock, Save, Palette, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { AppearanceSettings } from './appearance-settings';
import { useThemeStore } from '@/stores/theme-store';
import { useAppStore } from '@/stores/app-store';

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [isSaving, setIsSaving] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return useAppStore.getState().profileTab === 'appearance' ? 'appearance' : 'account';
    }
    return 'account';
  });

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : 'U';

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    updateUser({ bio });
    setIsSaving(false);
    toast.success('Profile updated successfully!');
  };

  const handleResetTheme = () => {
    useThemeStore.getState().resetTheme();
    toast.success('Theme reset to defaults');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Profile & Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and appearance settings</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.avatar || undefined} alt={user?.firstName} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary font-medium">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left space-y-2">
              <h2 className="text-xl font-bold">
                {user?.firstName} {user?.lastName}
              </h2>
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <Badge
                  className={`text-xs px-2 py-0.5 ${
                    user?.role === 'SUPER_ADMIN'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      : user?.role === 'ADMIN'
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      : user?.role === 'PROFESSOR'
                      ? 'bg-primary/10 text-primary dark:bg-primary/20'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {user?.role?.replace('_', ' ')}
                </Badge>
                {user?.isActive && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5 text-emerald-600">
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="account" className="gap-1.5">
            <User className="h-3.5 w-3.5" />
            Account
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5">
            <Palette className="h-3.5 w-3.5" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Information</CardTitle>
              <CardDescription>Your account details and activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    First Name
                  </Label>
                  <Input value={user?.firstName || ''} disabled className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Last Name
                  </Label>
                  <Input value={user?.lastName || ''} disabled className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </Label>
                  <Input value={user?.email || ''} disabled className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    Role
                  </Label>
                  <Input value={user?.role?.replace('_', ' ') || ''} disabled className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined
                  </Label>
                  <Input
                    value={user?.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'N/A'}
                    disabled
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Last Login
                  </Label>
                  <Input
                    value={user?.lastLoginAt ? format(new Date(user.lastLoginAt), 'MMM d, yyyy HH:mm') : 'N/A'}
                    disabled
                    className="bg-muted/50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bio</CardTitle>
              <CardDescription>Share a little about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a bit about yourself..."
                rows={4}
                className="scrollbar-thin"
              />
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" onClick={handleResetTheme}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset to Defaults
            </Button>
          </div>
          <AppearanceSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
