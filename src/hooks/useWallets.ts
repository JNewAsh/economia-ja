import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Wallet } from '@/lib/supabase';

export function useWallets(userId: string) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchWallets() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setWallets(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchWallets();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('wallets_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchWallets();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const createWallet = async (walletData: Partial<Wallet>) => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .insert([{ ...walletData, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateWallet = async (walletId: string, updates: Partial<Wallet>) => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .update(updates)
        .eq('id', walletId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    wallets,
    loading,
    error,
    createWallet,
    updateWallet,
  };
}
