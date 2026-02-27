import { useNavigate } from 'react-router-dom';
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
    if (error || !data) return null;
    return data as UserProfile;
  } catch {
    return null;
  }
}

export function useAuth() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();
  const navigate = useNavigate();

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Login error:', error);
      throw error;
    }

    // Eagerly fetch profile and set user right here instead of
    // waiting for onAuthStateChange (which can deadlock / race)
    if (data.user) {
      const profile = await fetchUserProfile(data.user.id);
      setUser(profile);
      setLoading(false);

      if (profile) {
        const redirectTo = profile.role === 'admin' ? '/admin/restaurants' : '/pos/orders';
        navigate(redirectTo, { replace: true });
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/login');
  };

  return { user, isLoading, signIn, signOut };
}
