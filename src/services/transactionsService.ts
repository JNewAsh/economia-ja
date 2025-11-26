import { supabase, addTransactionAndUpdateBalances } from '@/lib/supabase';
import type { TransactionType } from '@/lib/supabase';

/**
 * Serviço para gerenciar transações
 */
export const transactionsService = {
  /**
   * Adiciona uma transação e atualiza automaticamente os saldos
   */
  async addTransaction(params: {
    userId: string;
    walletId?: string;
    goalId?: string;
    amount: number;
    category: string;
    type: TransactionType;
    description?: string;
    date?: string;
  }) {
    try {
      // Usar a função RPC que atualiza tudo atomicamente
      const transactionId = await addTransactionAndUpdateBalances({
        userId: params.userId,
        walletId: params.walletId,
        goalId: params.goalId,
        amount: params.amount,
        category: params.category,
        type: params.type,
        description: params.description,
      });

      return { success: true, transactionId };
    } catch (error: any) {
      console.error('Erro ao adicionar transação:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Busca transações por período
   */
  async getTransactionsByPeriod(
    userId: string,
    startDate: string,
    endDate: string
  ) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Erro ao buscar transações:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Busca transações por categoria
   */
  async getTransactionsByCategory(userId: string, category: string) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .order('date', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Erro ao buscar transações por categoria:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Calcula totais por tipo (receita/despesa)
   */
  async getTotalsByType(userId: string, startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      const totals = {
        income: 0,
        expense: 0,
        balance: 0,
      };

      data?.forEach((transaction) => {
        if (transaction.type === 'income') {
          totals.income += transaction.amount;
        } else if (transaction.type === 'expense') {
          totals.expense += transaction.amount;
        }
      });

      totals.balance = totals.income - totals.expense;

      return { success: true, totals };
    } catch (error: any) {
      console.error('Erro ao calcular totais:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Busca transações recentes
   */
  async getRecentTransactions(userId: string, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Erro ao buscar transações recentes:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Atualiza uma transação
   */
  async updateTransaction(
    transactionId: string,
    userId: string,
    updates: {
      amount?: number;
      category?: string;
      description?: string;
      date?: string;
    }
  ) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', transactionId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Erro ao atualizar transação:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Deleta uma transação
   */
  async deleteTransaction(transactionId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao deletar transação:', error);
      return { success: false, error: error.message };
    }
  },
};
