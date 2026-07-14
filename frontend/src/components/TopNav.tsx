import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Smartphone,
  Flame,
  Users,
  Crown,
  Bell,
  LogOut,
  Code2
} from 'lucide-react';

export default function TopNav() {
  const { user, profile, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-end px-6 shadow-[0_4px_24px_rgba(0,0,0,0.01)] z-30 sticky top-0">
      
      {/* Right Side Tools & Profile */}
      <div className="flex items-center gap-3">
        
        {/* Profile Avatar Menu */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex items-center justify-center font-bold text-lg shadow-sm hover:ring-2 hover:ring-indigo-200 transition-all outline-none"
          >
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <p className="text-sm font-bold text-gray-900">{profile?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{profile?.email || 'user@example.com'}</p>
              </div>
              <div className="p-1">
                <button 
                  onClick={() => { setDropdownOpen(false); /* Navigate to profile */ }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg flex items-center gap-2 font-medium transition-colors"
                >
                  <Users className="h-4 w-4" /> Profile
                </button>
                <button 
                  onClick={logout} 
                  className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 font-medium transition-colors mt-1"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
