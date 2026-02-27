import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { UserProfile } from '@/types/database';

async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }
    return data as UserProfile;
  } catch (err) {
    console.error('User profile fetch exception:', err);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const initialized = useRef(false);

  useEffect(() => {
    let mounted = true;

    // Safety timeout — if auth takes longer than 5s, stop loading
    // and let the user see login (prevents infinite spinner forever)
    const safetyTimer = setTimeout(() => {
      if (mounted && useAuthStore.getState().isLoading) {
        console.warn('Auth initialization timed out, clearing loading state');
        setLoading(false);
      }
    }, 5000);

    // Step 1: Do the initial session check ourselves (NOT inside onAuthStateChange)
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          if (mounted) {
            setUser(profile);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
          initialized.current = true;
        }
      }
    };

    initAuth();

    // Step 2: Listen for FUTURE auth changes (sign-in, sign-out, token refresh)
    // IMPORTANT: Do NOT make Supabase DB calls directly inside this callback.
    // Supabase docs warn this causes deadlocks. Use setTimeout to defer.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        // Skip the initial event — we handle it in initAuth above
        if (event === 'INITIAL_SESSION') return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          // Defer the DB call to avoid Supabase internal deadlock
          setTimeout(async () => {
            if (!mounted) return;
            const profile = await fetchUserProfile(session.user.id);
            if (mounted) {
              setUser(profile);
              setLoading(false);
            }
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [setUser, setLoading]);

  return <>{children}</>;
}
