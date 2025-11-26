import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Transaction } from '@/lib/supabase';

export function useTransactions(userId: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchTransactions() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(50);

        if (error) throw error;
        setTransactions(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const createTransaction = async (transactionData: Partial<Transaction>) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ ...transactionData, user_id: userId }])
        .select()
        .single();

      if (error) throw error;

      // Update wallet balance if wallet_id is provided
      if (transactionData.wallet_id && transactionData.amount && transactionData.type) {
        const multiplier = transactionData.type === 'income' ? 1 : -1;
        await supabase.rpc('update_wallet_balance', {
          wallet_id: transactionData.wallet_id,
          amount: Number(transactionData.amount) * multiplier,
        });
      }

      // Update goal progress if goal_id is provided
      if (transactionData.goal_id && transactionData.amount) {
        await supabase.rpc('update_goal_progress', {
          goal_id: transactionData.goal_id,
          amount: Number(transactionData.amount),
        });
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    transactions,
    loading,
    error,
    createTransaction,
  };
}
