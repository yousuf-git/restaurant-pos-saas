import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Building2, LayoutDashboard, LogOut, UtensilsCrossed, Users, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/restaurants', label: 'Restaurants', icon: Building2 },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/items', label: 'Items', icon: Package },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside className="w-60 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border shrink-0">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <UtensilsCrossed className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          <span className="font-bold text-sidebar-accent-foreground">Admin Panel</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {adminLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )
              }
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
          <p className="px-3 text-xs text-sidebar-foreground truncate">{user?.email}</p>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
