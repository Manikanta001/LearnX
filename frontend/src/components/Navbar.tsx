import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Map,
  Trophy,
  Timer,
  LogOut,
  Menu,
  X,
  Shield,
  MessageSquare,
  Sparkles,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Core links for authenticated students
  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/courses', label: 'Courses', icon: GraduationCap },
    { href: '/problems', label: 'Practice', icon: BookOpen },
    { href: '/forum', label: 'Discussions', icon: MessageSquare },
    { href: '/ai-features', label: 'AI Center', icon: Sparkles },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-bold text-2xl tracking-tight">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white shadow-md">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent font-extrabold">LearnX</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-1">
          {user &&
            navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link key={link.href} to={link.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn('gap-2 rounded-full font-medium transition-all duration-200', isActive && 'bg-primary/10 text-primary hover:bg-primary/20')}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
        </div>

        {/* Desktop Authentication / Dashboard redirects */}
        <div className="hidden lg:flex items-center gap-2">
          {user ? (
            <>
              {/* Role specific quick dashboards */}
              {user.role === 'admin' && (
                <Link to="/admin-dashboard">
                  <Button variant="outline" size="sm" className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-full">
                    <Shield className="h-4 w-4" />
                    Admin Panel
                  </Button>
                </Link>
              )}
              {user.role === 'instructor' && (
                <Link to="/instructor-dashboard">
                  <Button variant="outline" size="sm" className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-full">
                    <GraduationCap className="h-4 w-4" />
                    Instructor Panel
                  </Button>
                </Link>
              )}

              {/* Profile Link */}
              <Link to="/profile">
                <Button variant="ghost" size="sm" className="gap-1.5 rounded-full">
                  <User className="h-4 w-4" />
                  Profile
                </Button>
              </Link>

              {/* Logout */}
              <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5 text-muted-foreground hover:text-destructive rounded-full">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="rounded-full">Login</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="rounded-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 shadow-sm text-white">Sign Up</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden rounded-full"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Drawer menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t bg-background p-4 space-y-2 animate-in slide-in-from-top-4 duration-200">
          {user &&
            navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn('w-full justify-start gap-3 rounded-xl', isActive && 'bg-primary/10 text-primary')}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
          
          <div className="pt-2 border-t space-y-2">
            {user ? (
              <div className="space-y-2">
                {user.role === 'admin' && (
                  <Link to="/admin-dashboard" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full justify-start gap-3 border-indigo-200 text-indigo-700 rounded-xl">
                      <Shield className="h-5 w-5" />
                      Admin Panel
                    </Button>
                  </Link>
                )}
                {user.role === 'instructor' && (
                  <Link to="/instructor-dashboard" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full justify-start gap-3 border-indigo-200 text-indigo-700 rounded-xl">
                      <GraduationCap className="h-5 w-5" />
                      Instructor Panel
                    </Button>
                  </Link>
                )}
                <Link to="/profile" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl">
                    <User className="h-5 w-5" />
                    My Profile
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-destructive rounded-xl"
                  onClick={() => { logout(); setMobileOpen(false); }}
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full rounded-xl">Login</Button>
                </Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
