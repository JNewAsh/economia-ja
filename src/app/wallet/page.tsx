"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Home, Target, Wallet, BookOpen, User, Plus, ArrowLeft, Loader2, TrendingUp, TrendingDown, Edit, Trash2, PiggyBank } from 'lucide-react';

interface WalletData {
  id: string;
  name: string;
  type: 'cash' | 'investment' | 'card' | 'reserve';
  balance: number;
  currency: string;
  created_at: string;
}

export default function WalletPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [userId, setUserId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingWallet, setCreatingWallet] = useState(false);

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
        .select('*')
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

  async function handleCreateWallet(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreatingWallet(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      const walletData = {
        user_id: userId,
        name: formData.get('name') as string,
        type: formData.get('type') as 'cash' | 'investment' | 'card' | 'reserve',
        balance: Number(formData.get('balance')) || 0,
        currency: 'BRL'
      };

      const { error } = await supabase
        .from('wallets')
        .insert(walletData);

      if (error) throw error;

      await loadWallets(userId);
      setShowCreateModal(false);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Erro ao criar carteira:', error);
      alert('Erro ao criar carteira. Tente novamente.');
    } finally {
      setCreatingWallet(false);
    }
  }

  async function handleDeleteWallet(walletId: string) {
    if (!confirm('Tem certeza que deseja excluir esta carteira?')) return;

    try {
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', walletId);

      if (error) throw error;

      await loadWallets(userId);
    } catch (error) {
      console.error('Erro ao excluir carteira:', error);
      alert('Erro ao excluir carteira. Tente novamente.');
    }
  }

  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFB]">
        <Loader2 className="h-8 w-8 animate-spin text-[#3D73FF]" />
      </div>
    );
  }

  // Modal de criar carteira
  if (showCreateModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#3D73FF] to-[#0A0A0A] p-6">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 rounded-full mb-6"
            onClick={() => setShowCreateModal(false)}
            disabled={creatingWallet}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>

          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Nova Carteira</h2>
              <p className="text-white/80">Crie uma carteira para organizar seus recursos</p>
            </div>

            <form onSubmit={handleCreateWallet} className="space-y-6">
              <div className="space-y-2">
                <label className="text-white font-medium block">
                  📝 Nome da Carteira
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ex: Reserva de Emergência"
                  className="w-full p-4 rounded-xl bg-white/20 backdrop-blur-sm text-white placeholder:text-white/50 border-2 border-white/30 focus:border-white/60 focus:outline-none transition-all text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-white font-medium block">
                  🏷️ Tipo de Carteira
                </label>
                <select
                  name="type"
                  required
                  className="w-full p-4 rounded-xl bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 focus:border-white/60 focus:outline-none transition-all text-lg"
                >
                  <option value="cash" className="bg-[#0A0A0A]">💵 Dinheiro</option>
                  <option value="investment" className="bg-[#0A0A0A]">📈 Investimento</option>
                  <option value="card" className="bg-[#0A0A0A]">💳 Cartão</option>
                  <option value="reserve" className="bg-[#0A0A0A]">🏦 Reserva</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-white font-medium block">
                  💰 Saldo Inicial
                </label>
                <input
                  type="number"
                  name="balance"
                  step="0.01"
                  placeholder="R$ 0,00"
                  className="w-full p-4 rounded-xl bg-white/20 backdrop-blur-sm text-white placeholder:text-white/50 border-2 border-white/30 focus:border-white/60 focus:outline-none transition-all text-lg"
                />
              </div>

              <Button
                type="submit"
                disabled={creatingWallet}
                className="w-full bg-white text-[#3D73FF] hover:bg-white/90 rounded-xl py-6 text-lg font-semibold mt-8 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingWallet ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Criando...
                  </>
                ) : (
                  'Criar Carteira'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFB] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#3D73FF] to-[#0A0A0A] text-white p-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 rounded-full"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold">Minhas Carteiras</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 rounded-full"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        {/* Resumo Total */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <p className="text-white/80 text-sm mb-2">Saldo Total</p>
          <p className="text-4xl font-bold mb-4">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBalance)}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-xs mb-1">Carteiras</p>
              <p className="text-white font-semibold">{wallets.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Carteiras */}
      <div className="p-6 space-y-4">
        {wallets.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <PiggyBank className="h-16 w-16 text-[#6C6C6C] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#0A0A0A] mb-2">Nenhuma carteira criada</h3>
            <p className="text-[#6C6C6C] mb-6">Crie sua primeira carteira para começar a organizar suas finanças</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#3D73FF] hover:bg-[#3D73FF]/90 rounded-xl"
            >
              <Plus className="h-5 w-5 mr-2" />
              Criar Primeira Carteira
            </Button>
          </div>
        ) : (
          wallets.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              onDelete={() => handleDeleteWallet(wallet.id)}
            />
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav currentPage="wallet" />
    </div>
  );
}

function WalletCard({ wallet, onDelete }: { wallet: WalletData; onDelete: () => void }) {
  const typeIcons = {
    cash: '💵',
    investment: '📈',
    card: '💳',
    reserve: '🏦'
  };

  const typeLabels = {
    cash: 'Dinheiro',
    investment: 'Investimento',
    card: 'Cartão',
    reserve: 'Reserva'
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#3D73FF] to-[#0A0A0A] rounded-xl flex items-center justify-center text-2xl">
            {typeIcons[wallet.type]}
          </div>
          <div>
            <h3 className="font-bold text-[#0A0A0A] text-lg">{wallet.name}</h3>
            <p className="text-sm text-[#6C6C6C]">{typeLabels[wallet.type]}</p>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-4">
        <p className="text-sm text-[#6C6C6C] mb-1">Saldo Atual</p>
        <p className="text-3xl font-bold text-[#0A0A0A]">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(wallet.balance)}
        </p>
      </div>
    </div>
  );
}

function BottomNav({ currentPage }: { currentPage: string }) {
  const router = useRouter();
  
  const navItems = [
    { id: 'home', icon: Home, label: 'Início', path: '/dashboard' },
    { id: 'goals', icon: Target, label: 'Metas', path: '/goals' },
    { id: 'wallet', icon: Wallet, label: 'Carteira', path: '/wallet' },
    { id: 'tips', icon: BookOpen, label: 'Dicas', path: '/tips' },
    { id: 'profile', icon: User, label: 'Perfil', path: '/profile' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors ${
                isActive ? 'text-[#3D73FF]' : 'text-[#6C6C6C]'
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
