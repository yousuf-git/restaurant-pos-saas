import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBillStore } from '@/stores/billStore';
import { ClipboardList, LogOut, ShoppingBag, BarChart3, UtensilsCrossed, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const posLinks = [
  { to: '/pos/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/pos/menu', label: 'Menu', icon: ClipboardList },
  { to: '/pos/order-history', label: 'Order History', icon: History },
  { to: '/pos/summary', label: 'Summary', icon: BarChart3 },
];

export function PosLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const restaurant = useBillStore((s) => s.restaurant);

  return (
    <div className="flex min-h-screen w-full">
      {/* Slim sidebar — icon only */}
      <aside className="w-16 bg-sidebar text-sidebar-foreground flex flex-col items-center border-r border-sidebar-border shrink-0">
        <div className="py-4">
          {restaurant?.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="w-10 h-10 rounded-xl object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
          )}
        </div>

        <nav className="flex-1 flex flex-col items-center gap-1 py-4">
          {posLinks.map((link) => (
            <Tooltip key={link.to} delayDuration={0}>
              <TooltipTrigger asChild>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )
                  }
                >
                  <link.icon className="w-5 h-5" />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">{link.label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>

        <div className="py-4">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={signOut}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign Out</TooltipContent>
          </Tooltip>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
