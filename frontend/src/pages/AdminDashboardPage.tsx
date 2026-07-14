import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Users, BookOpen, UserMinus, UserCheck, AlertOctagon, GraduationCap } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [coursesCount, setCoursesCount] = useState(0);
  const [blockingUserId, setBlockingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [usersRes, coursesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/courses'),
      ]);
      setUsersList(usersRes.data);
      setCoursesCount(coursesRes.data.length);
    } catch (err) {
      console.error('Fetch admin data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchAdminData();
  }, [user]);

  const handleToggleBlock = async (targetUserId: string) => {
    try {
      setBlockingUserId(targetUserId);
      const res = await api.post(`/admin/users/${targetUserId}/toggle-block`);
      
      // Update local state
      setUsersList((prev) =>
        prev.map((u) => (u._id === targetUserId ? { ...u, isBlocked: res.data.user.isBlocked } : u))
      );
    } catch (err) {
      console.error('Toggle block error:', err);
      alert('Failed to modify user status.');
    } finally {
      setBlockingUserId(null);
    }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account? This action cannot be undone.')) {
      return;
    }
    try {
      setDeletingUserId(targetUserId);
      await api.delete(`/admin/users/${targetUserId}`);
      // Remove from local list
      setUsersList((prev) => prev.filter((u) => u._id !== targetUserId));
    } catch (err: any) {
      console.error('Delete user error:', err);
      alert(err.response?.data?.error || 'Failed to delete user account.');
    } finally {
      setDeletingUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-44 w-full" />
      </div>
    );
  }

  const students = usersList.filter((u) => u.role === 'student');
  const instructors = usersList.filter((u) => u.role === 'instructor');

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Administrator Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Platform analytics and administrative user access control lists.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border hover:shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Platform Users</p>
              <p className="text-3xl font-extrabold text-foreground">{usersList.length}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border hover:shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider font-bold">Students Registered</p>
              <p className="text-3xl font-extrabold text-foreground">{students.length}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <GraduationCap className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border hover:shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Instructors Certified</p>
              <p className="text-3xl font-extrabold text-foreground">{instructors.length}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Shield className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border hover:shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Courses Active</p>
              <p className="text-3xl font-extrabold text-foreground">{coursesCount}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">User Management</h2>
        
        {usersList.length === 0 ? (
          <div className="text-center py-12 border rounded-xl bg-card">
            <Users className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground mt-2">No users registered on the platform.</p>
          </div>
        ) : (
          <div className="border rounded-xl overflow-x-auto bg-card shadow-sm">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-muted/40 border-b text-xs text-muted-foreground uppercase font-bold">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Credits (XP)</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {usersList.map((u) => (
                  <tr key={u._id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 font-bold text-foreground">{u.name}</td>
                    <td className="p-4 text-muted-foreground">{u.email}</td>
                    <td className="p-4">
                      <span className={classNameMap(
                        'text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider',
                        u.role === 'admin' && 'bg-purple-100 text-purple-700',
                        u.role === 'instructor' && 'bg-indigo-100 text-indigo-700',
                        u.role === 'student' && 'bg-blue-100 text-blue-700',
                      )}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground font-semibold">{u.xp || 0} XP</td>
                    <td className="p-4 text-center">
                      {u.isBlocked ? (
                        <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded flex items-center gap-1.5 justify-center max-w-24 mx-auto">
                          <AlertOctagon className="h-3.5 w-3.5" /> Blocked
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1.5 justify-center max-w-24 mx-auto">
                          <UserCheck className="h-3.5 w-3.5" /> Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {user?.id !== u._id && u.role !== 'admin' ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant={u.isBlocked ? 'default' : 'destructive'}
                            disabled={blockingUserId === u._id || deletingUserId === u._id}
                            onClick={() => handleToggleBlock(u._id)}
                            className="rounded-full shadow-sm"
                          >
                            {u.isBlocked ? (
                              <span className="flex items-center gap-1.5">Unblock <UserCheck className="h-3.5 w-3.5" /></span>
                            ) : (
                              <span className="flex items-center gap-1.5">Block User <UserMinus className="h-3.5 w-3.5" /></span>
                            )}
                          </Button>
                          
                          {/* Only show delete button for Real Admin */}
                          {!user?.isTestUser && (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={deletingUserId === u._id || blockingUserId === u._id}
                              onClick={() => handleDeleteUser(u._id)}
                              className="rounded-full shadow-sm bg-rose-600 hover:bg-rose-700 text-white"
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic pr-4">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function classNameMap(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
