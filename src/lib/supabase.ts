import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: 'cash' | 'investment' | 'card' | 'reserve';
  balance: number;
  goal_amount?: number;
  goal_description?: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  frequency: 'monthly' | 'weekly' | 'one-time' | null;
  auto_contribution: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string | null;
  goal_id: string | null;
  amount: number;
  category: string;
  subcategory: string | null;
  type: 'expense' | 'income' | 'transfer';
  description: string | null;
  date: string;
  created_at: string;
}

export interface FinancialQuestionnaire {
  id: string;
  user_id: string;
  receita: number;
  aluguel: number;
  compras: number;
  outros: number;
  created_at: string;
}

export interface Tip {
  id: string;
  title: string;
  slug: string;
  body: string;
  level: 'basic' | 'intermediate' | 'advanced';
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  level: number;
  points: number;
  streak_days: number;
  last_activity_date: string;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
}
