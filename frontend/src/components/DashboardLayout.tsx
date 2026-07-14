import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from './ui/skeleton';

export default function DashboardLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f8f9fa]">
        <div className="space-y-4 flex flex-col items-center">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen w-full bg-[#f8f9fa]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
