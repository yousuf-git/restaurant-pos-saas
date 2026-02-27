import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UtensilsCrossed, ShieldCheck, User } from 'lucide-react';

const TEST_ADMIN = { email: 'admin@restpos.com', password: 'admin123' };
const TEST_OPERATOR = { email: 'ali@restpos.com', password: 'operator123' };

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in (e.g. navigated to /login while session active)
  useEffect(() => {
    if (user) {
      const redirectTo = user.role === 'admin' ? '/admin/restaurants' : '/pos/orders';
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      // signIn handles navigation on success
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (creds: { email: string; password: string }) => {
    setEmail(creds.email);
    setPassword(creds.password);
    setError('');
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-bill text-bill-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-bill-accent" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-bill-accent" />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary mb-8">
            <UtensilsCrossed className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Restaurant POS</h1>
          <p className="text-bill-muted text-lg max-w-md">
            Fast, reliable point-of-sale system for take-away restaurants.
          </p>
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
              <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">Restaurant POS</h1>
          </div>

          <h2 className="text-2xl font-bold mb-1">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Sign in to your account</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@restaurant.com"
                required
                autoFocus
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          {/* Quick-fill test credentials */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3 text-center">Quick login (test accounts)</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => fillCredentials(TEST_ADMIN)}
              >
                <ShieldCheck className="w-4 h-4" />
                Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => fillCredentials(TEST_OPERATOR)}
              >
                <User className="w-4 h-4" />
                Operator
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
