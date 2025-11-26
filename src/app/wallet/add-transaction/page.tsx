"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, TrendingUp, TrendingDown } from 'lucide-react';

interface WalletOption {
  id: string;
  name: string;
}

export default function AddTransactionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');
  const [wallets, setWallets] = useState<WalletOption[]>([]);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');

  useEffect(() => {
    checkAuthAndLoadWallets();
  }, []);

  async function checkAuthAndLoadWallets() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      router.push('/welcome');
      return;
    }

    setUserId(session.user.id);
    await loadWallets(session.user.id);
  }

  async function loadWallets(userId: string) {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('id, name')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setWallets(data || []);
    } catch (error) {
      console.error('Erro ao carregar carteiras:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      const amount = Number(formData.get('amount'));
      const category = formData.get('category') as string;
      const description = formData.get('description') as string;
      const date = formData.get('date') as string;
      const walletId = formData.get('wallet_id') as string || null;

      // Inserir transação
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          wallet_id: walletId,
          amount,
          category,
          type: transactionType,
          description,
          date
        });

      if (transactionError) throw transactionError;

      // Atualizar saldo da carteira se selecionada
      if (walletId) {
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('id', walletId)
          .single();

        if (wallet) {
          const newBalance = transactionType === 'income' 
            ? Number(wallet.balance) + amount
            : Number(wallet.balance) - amount;

          await supabase
            .from('wallets')
            .update({ balance: newBalance })
            .eq('id', walletId);
        }
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      alert('Erro ao salvar transação. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFB]">
        <Loader2 className="h-8 w-8 animate-spin text-[#3D73FF]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3D73FF] to-[#0A0A0A] p-6">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 rounded-full mb-6"
          onClick={() => router.push('/dashboard')}
          disabled={saving}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              {transactionType === 'income' ? (
                <TrendingUp className="h-8 w-8 text-white" />
              ) : (
                <TrendingDown className="h-8 w-8 text-white" />
              )}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Nova Transação</h2>
            <p className="text-white/80">Registre uma receita ou despesa</p>
          </div>

          {/* Tipo de Transação */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setTransactionType('income')}
              className={`p-4 rounded-xl font-semibold transition-all ${
                transactionType === 'income'
                  ? 'bg-green-500 text-white'
                  : 'bg-white/20 text-white/60'
              }`}
            >
              <TrendingUp className="h-5 w-5 mx-auto mb-2" />
              Receita
            </button>
            <button
              type="button"
              onClick={() => setTransactionType('expense')}
              className={`p-4 rounded-xl font-semibold transition-all ${
                transactionType === 'expense'
                  ? 'bg-red-500 text-white'
                  : 'bg-white/20 text-white/60'
              }`}
            >
              <TrendingDown className="h-5 w-5 mx-auto mb-2" />
              Despesa
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-white font-medium block">
                💰 Valor
              </label>
              <input
                type="number"
                name="amount"
                step="0.01"
                required
                placeholder="R$ 0,00"
                className="w-full p-4 rounded-xl bg-white/20 backdrop-blur-sm text-white placeholder:text-white/50 border-2 border-white/30 focus:border-white/60 focus:outline-none transition-all text-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-white font-medium block">
                🏷️ Categoria
              </label>
              <select
                name="category"
                required
                className="w-full p-4 rounded-xl bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 focus:border-white/60 focus:outline-none transition-all text-lg"
              >
                {transactionType === 'income' ? (
                  <>
                    <option value="Salário" className="bg-[#0A0A0A]">Salário</option>
                    <option value="Freelance" className="bg-[#0A0A0A]">Freelance</option>
                    <option value="Investimentos" className="bg-[#0A0A0A]">Investimentos</option>
                    <option value="Outros" className="bg-[#0A0A0A]">Outros</option>
                  </>
                ) : (
                  <>
                    <option value="Moradia" className="bg-[#0A0A0A]">Moradia</option>
                    <option value="Alimentação" className="bg-[#0A0A0A]">Alimentação</option>
                    <option value="Transporte" className="bg-[#0A0A0A]">Transporte</option>
                    <option value="Compras" className="bg-[#0A0A0A]">Compras</option>
                    <option value="Lazer" className="bg-[#0A0A0A]">Lazer</option>
                    <option value="Saúde" className="bg-[#0A0A0A]">Saúde</option>
                    <option value="Educação" className="bg-[#0A0A0A]">Educação</option>
                    <option value="Outros" className="bg-[#0A0A0A]">Outros</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-white font-medium block">
                📝 Descrição
              </label>
              <input
                type="text"
                name="description"
                placeholder="Ex: Compra no supermercado"
                className="w-full p-4 rounded-xl bg-white/20 backdrop-blur-sm text-white placeholder:text-white/50 border-2 border-white/30 focus:border-white/60 focus:outline-none transition-all text-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-white font-medium block">
                📅 Data
              </label>
              <input
                type="date"
                name="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full p-4 rounded-xl bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 focus:border-white/60 focus:outline-none transition-all text-lg"
              />
            </div>

            {wallets.length > 0 && (
              <div className="space-y-2">
                <label className="text-white font-medium block">
                  💼 Carteira (Opcional)
                </label>
                <select
                  name="wallet_id"
                  className="w-full p-4 rounded-xl bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 focus:border-white/60 focus:outline-none transition-all text-lg"
                >
                  <option value="" className="bg-[#0A0A0A]">Nenhuma carteira</option>
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id} className="bg-[#0A0A0A]">
                      {wallet.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-white text-[#3D73FF] hover:bg-white/90 rounded-xl py-6 text-lg font-semibold mt-8 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                'Salvar Transação'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
