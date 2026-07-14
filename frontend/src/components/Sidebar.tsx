import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  GraduationCap,
  Library,
  Trophy,
  MessageSquare,
  Sparkles,
  Code2,
  Settings,
  ClipboardList,
  Award,
} from 'lucide-react';

export default function Sidebar() {
  const { pathname } = useLocation();

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/courses', label: 'Courses', icon: GraduationCap },
    { href: '/study-materials', label: 'Study Materials', icon: Library },
    { href: '/assignments', label: 'Assignments', icon: ClipboardList },
    { href: '/quizzes', label: 'Quizzes', icon: Award },
    { href: '/problems', label: 'Problems', icon: Code2 },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/forum', label: 'Discussions', icon: MessageSquare },
  ];

  return (
    <aside className="w-64 bg-white border-r h-screen sticky top-0 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-40">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-gray-900 font-extrabold tracking-tight">LearnX</span>
        </Link>
      </div>

      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Menu</div>
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          
          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-colors',
                  isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'
                )}
              />
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-100">
        <Link
          to="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
        >
          <Settings className="h-5 w-5 text-gray-400" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
