import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Goal } from '@/lib/supabase';

export function useGoals(userId: string) {
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchGoals();
  }, [userId]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goalData: Partial<Goal>) => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: userId,
          ...goalData,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchGoals();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', goalId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      await fetchGoals();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const contributeToGoal = async (goalId: string, amount: number) => {
    try {
      // Buscar meta atual
      const { data: goal, error: fetchError } = await supabase
        .from('goals')
        .select('current_amount')
        .eq('id', goalId)
        .single();

      if (fetchError) throw fetchError;

      // Atualizar com novo valor
      const newAmount = Number(goal.current_amount) + amount;
      const { error: updateError } = await supabase
        .from('goals')
        .update({ current_amount: newAmount })
        .eq('id', goalId);

      if (updateError) throw updateError;
      await fetchGoals();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return { goals, loading, error, createGoal, updateGoal, contributeToGoal, refetch: fetchGoals };
}
