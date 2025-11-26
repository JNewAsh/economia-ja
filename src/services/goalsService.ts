import { supabase } from '@/lib/supabase';
import type { Goal } from '@/lib/supabase';

/**
 * Serviço para gerenciar metas financeiras
 */
export const goalsService = {
  /**
   * Cria uma nova meta
   */
  async createGoal(
    userId: string,
    goalData: {
      title: string;
      target_amount: number;
      target_date?: string;
      frequency?: 'monthly' | 'weekly' | 'one-time';
      auto_contribution?: number;
    }
  ) {
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
      return { success: true, data };
    } catch (error: any) {
      console.error('Erro ao criar meta:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Busca todas as metas ativas do usuário
   */
  async getActiveGoals(userId: string) {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Erro ao buscar metas:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Atualiza uma meta
   */
  async updateGoal(
    goalId: string,
    userId: string,
    updates: Partial<Goal>
  ) {
    try {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', goalId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Erro ao atualizar meta:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Adiciona contribuição a uma meta
   */
  async contributeToGoal(goalId: string, userId: string, amount: number) {
    try {
      // Buscar meta atual
      const { data: goal, error: fetchError } = await supabase
        .from('goals')
        .select('current_amount')
        .eq('id', goalId)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      // Atualizar com novo valor
      const newAmount = goal.current_amount + amount;

      const { data, error } = await supabase
        .from('goals')
        .update({ current_amount: newAmount })
        .eq('id', goalId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Erro ao contribuir para meta:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Desativa uma meta (soft delete)
   */
  async deactivateGoal(goalId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ is_active: false })
        .eq('id', goalId)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao desativar meta:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Calcula progresso de uma meta
   */
  calculateProgress(currentAmount: number, targetAmount: number): number {
    if (targetAmount === 0) return 0;
    return Math.min((currentAmount / targetAmount) * 100, 100);
  },

  /**
   * Calcula meses restantes para atingir meta
   */
  calculateMonthsToGoal(
    currentAmount: number,
    targetAmount: number,
    monthlyContribution: number
  ): number {
    if (monthlyContribution === 0) return Infinity;
    const remaining = targetAmount - currentAmount;
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / monthlyContribution);
  },

  /**
   * Verifica se meta foi concluída
   */
  isGoalCompleted(currentAmount: number, targetAmount: number): boolean {
    return currentAmount >= targetAmount;
  },

  /**
   * Busca metas concluídas
   */
  async getCompletedGoals(userId: string) {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .gte('current_amount', supabase.raw('target_amount'))
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Erro ao buscar metas concluídas:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Busca estatísticas de metas
   */
  async getGoalsStats(userId: string) {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('current_amount, target_amount, is_active')
        .eq('user_id', userId);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        active: data?.filter((g) => g.is_active).length || 0,
        completed: data?.filter((g) => g.current_amount >= g.target_amount).length || 0,
        totalSaved: data?.reduce((sum, g) => sum + g.current_amount, 0) || 0,
        totalTarget: data?.reduce((sum, g) => sum + g.target_amount, 0) || 0,
      };

      return { success: true, stats };
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas de metas:', error);
      return { success: false, error: error.message };
    }
  },
};
