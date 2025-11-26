import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Criar user_stats quando usuário se registra
      if (session?.user && _event === 'SIGNED_IN') {
        createUserStatsIfNotExists(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const register = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    
    // Criar user_stats para novo usuário
    if (data.user) {
      await createUserStatsIfNotExists(data.user.id);
    }
    
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return { user, loading, login, register, logout };
}

async function createUserStatsIfNotExists(userId: string) {
  const { data: existing } = await supabase
    .from('user_stats')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!existing) {
    await supabase.from('user_stats').insert({
      user_id: userId,
      level: 1,
      points: 0,
      streak_days: 0,
    });
  }
}
