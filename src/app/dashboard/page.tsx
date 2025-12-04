"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Home, Target, Wallet, BookOpen, User, Plus, TrendingUp, TrendingDown, Loader2, ArrowLeft, PieChart } from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  totalBalance: number;
  monthExpenses: number;
  monthIncome: number;
  activeGoals: number;
  recentTransactions: any[];
  goals: any[];
}

interface FinancialData {
  receita: number;
  aluguel: number;
  compras: number;
  outros: number;
  economia: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [savingQuestionnaire, setSavingQuestionnaire] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  async function checkAuthAndLoadData() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      router.push('/welcome');
      return;
    }

    setUserName(session.user.user_metadata?.name || 'Usuário');
    setUserId(session.user.id);
    await loadDashboardData(session.user.id);
  }

  async function loadDashboardData(userId: string) {
    try {
      // Buscar wallets
      const { data: wallets } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId);

      const totalBalance = wallets?.reduce((sum, w) => sum + Number(w.balance), 0) || 0;

      // Buscar transações do mês
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(5);

      const monthExpenses = transactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const monthIncome = transactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Buscar metas ativas
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);

      setData({
        totalBalance,
        monthExpenses,
        monthIncome,
        activeGoals: goals?.length || 0,
        recentTransactions: transactions || [],
        goals: goals || []
      });

      // Carregar dados financeiros salvos
      await loadFinancialData(userId);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadFinancialData(userId: string) {
    try {
      // Buscar último questionário respondido
      const { data: questionnaire } = await supabase
        .from('financial_questionnaires')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (questionnaire) {
        const totalDespesas = Number(questionnaire.rent_expense || 0) + Number(questionnaire.shopping_expense || 0) + Number(questionnaire.other_expenses || 0);
        const economia = Number(questionnaire.monthly_income || 0) - totalDespesas;

        setFinancialData({
          receita: Number(questionnaire.monthly_income || 0),
          aluguel: Number(questionnaire.rent_expense || 0),
          compras: Number(questionnaire.shopping_expense || 0),
          outros: Number(questionnaire.other_expenses || 0),
          economia
        });
      }
    } catch (error) {
      // Nenhum questionário encontrado ainda
      console.log('Nenhum questionário encontrado');
    }
  }

  async function handleQuestionnaireSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingQuestionnaire(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      const receita = Number(formData.get('receita')) || 0;
      const aluguel = Number(formData.get('aluguel')) || 0;
      const compras = Number(formData.get('compras')) || 0;
      const outros = Number(formData.get('outros')) || 0;
      
      const totalDespesas = aluguel + compras + outros;
      const economia = receita - totalDespesas;

      // Salvar questionário no Supabase
      const { error: questionnaireError } = await supabase
        .from('financial_questionnaires')
        .insert({
          user_id: userId,
          monthly_income: receita,
          rent_expense: aluguel,
          shopping_expense: compras,
          other_expenses: outros,
          total_expenses: totalDespesas,
          savings: economia
        });

      if (questionnaireError) {
        console.error('Erro ao salvar questionário:', questionnaireError);
        throw questionnaireError;
      }

      // Criar transações no Supabase
      const transactionsToInsert = [
        {
          user_id: userId,
          amount: receita,
          category: 'Salário',
          type: 'income',
          description: 'Receita Mensal',
          date: new Date().toISOString().split('T')[0]
        },
        {
          user_id: userId,
          amount: aluguel,
          category: 'Moradia',
          type: 'expense',
          description: 'Aluguel',
          date: new Date().toISOString().split('T')[0]
        },
        {
          user_id: userId,
          amount: compras,
          category: 'Compras',
          type: 'expense',
          description: 'Compras',
          date: new Date().toISOString().split('T')[0]
        }
      ];

      if (outros > 0) {
        transactionsToInsert.push({
          user_id: userId,
          amount: outros,
          category: 'Outros',
          type: 'expense',
          description: 'Outros Gastos',
          date: new Date().toISOString().split('T')[0]
        });
      }

      const { error: transactionsError } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

      if (transactionsError) {
        console.error('Erro ao criar transações:', transactionsError);
        throw transactionsError;
      }

      // Atualizar ou criar carteira principal
      const { data: existingWallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('name', 'Carteira Principal')
        .single();

      if (existingWallet) {
        // Atualizar saldo
        await supabase
          .from('wallets')
          .update({ balance: economia })
          .eq('id', existingWallet.id);
      } else {
        // Criar nova carteira
        await supabase
          .from('wallets')
          .insert({
            user_id: userId,
            name: 'Carteira Principal',
            type: 'cash',
            balance: economia,
            currency: 'BRL'
          });
      }

      const newFinancialData = {
        receita,
        aluguel,
        compras,
        outros,
        economia
      };

      setFinancialData(newFinancialData);
      
      // Recarregar dados do dashboard
      await loadDashboardData(userId);
      
      setShowQuestionnaire(false);
    } catch (error) {
      console.error('Erro ao salvar questionário:', error);
      alert('Erro ao salvar dados. Verifique se você configurou o Supabase corretamente.');
    } finally {
      setSavingQuestionnaire(false);
    }
  }

  function openDetailedDashboard() {
    if (!financialData) return;

    const win = window.open('', '_blank', 'width=1000,height=800');
    if (!win) return;

    const total = financialData.aluguel + financialData.compras + financialData.outros;
    const aluguelPct = total > 0 ? ((financialData.aluguel / total) * 100).toFixed(1) : '0';
    const comprasPct = total > 0 ? ((financialData.compras / total) * 100).toFixed(1) : '0';
    const outrosPct = total > 0 ? ((financialData.outros / total) * 100).toFixed(1) : '0';

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Dashboard Detalhado — EconomiaJÁ</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
body { font-family: Arial, sans-serif; margin: 24px; background:#fafafa; color:#111 }
.card { background: #fff; padding: 18px; border-radius: 12px; box-shadow: 0 6px 18px rgba(0,0,0,0.06); }
h1 { margin: 0 0 8px 0 }
.grid { display:flex; gap:16px; margin-top:12px; flex-wrap: wrap; }
.col { flex:1; min-width: 300px; }
.tip { margin-top:12px; padding:12px; background:#f3f7ff; border-radius:8px }
@media (max-width: 768px) {
  .grid { flex-direction: column; }
  .col { min-width: 100%; }
}
</style>
</head>
<body>
<div class="card">
<h1>Dashboard Detalhado</h1>
<p>Resumo individual e análise de gastos com base nos valores fornecidos.</p>
<div class="grid">
<div class="col">
<canvas id="pieChart" width="400" height="300"></canvas>
</div>
<div class="col">
<h3>Resumo</h3>
<ul>
<li>Aluguel: R$ ${financialData.aluguel.toFixed(2)} (${aluguelPct}%)</li>
<li>Compras: R$ ${financialData.compras.toFixed(2)} (${comprasPct}%)</li>
<li>Outros: R$ ${financialData.outros.toFixed(2)} (${outrosPct}%)</li>
<li>Total: R$ ${total.toFixed(2)}</li>
</ul>
<div class="tip">
<strong>Dica de economia:</strong>
<p>Seu gasto com aluguel é ${aluguelPct}% do total — ${Number(aluguelPct) > 30 ? 'acima do recomendado (ideal ≤30%)' : 'dentro do recomendado'}. ${Number(aluguelPct) > 30 ? 'Considere negociar aluguel, buscar alternativas mais baratas ou ajustar outra despesa variável para aumentar sua margem de poupança.' : 'Continue mantendo esse equilíbrio!'}</p>
</div>
</div>
</div>

<h3 style="margin-top:18px">Sugestões de ações</h3>
<ol>
<li>Negociar reajuste do aluguel ou pesquisar opções em bairros próximos.</li>
<li>Reduzir compras supérfluas com lista e planejamento.</li>
<li>Destinar uma meta de economia mensal e automatizar aportes.</li>
</ol>
</div>

<script>
const ctx = document.getElementById('pieChart').getContext('2d');
const pie = new Chart(ctx, {
type: 'pie',
data: {
labels: ['Aluguel', 'Compras', 'Outros'],
datasets: [{
data: [${financialData.aluguel}, ${financialData.compras}, ${financialData.outros}],
backgroundColor: ['#2d6cdf','#6fb1ef','#cfe6ff'],
borderColor: '#fff',
borderWidth: 2
}]
},
options: {
responsive: true,
plugins: { 
  legend: { position: 'bottom' },
  title: {
    display: true,
    text: 'Distribuição de Despesas'
  }
}
}
});
</script>
</body>
</html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFB]">
        <Loader2 className="h-8 w-8 animate-spin text-[#3D73FF]" />
      </div>
    );
  }

  // Tela do questionário
  if (showQuestionnaire) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#3D73FF] to-[#0A0A0A] p-6">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 rounded-full mb-6"
            onClick={() => setShowQuestionnaire(false)}
            disabled={savingQuestionnaire}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>

          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <PieChart className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Questionário Financeiro</h2>
              <p className="text-white/80">Vamos entender melhor suas finanças</p>
            </div>

            <form onSubmit={handleQuestionnaireSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-white font-medium block">
                  💰 Quanto você recebe no mês?
                </label>
                <input
                  type="number"
                  name="receita"
                  step="0.01"
                  required
                  placeholder="R$ 0,00"
                  className="w-full p-4 rounded-xl bg-white/20 backdrop-blur-sm text-white placeholder:text-white/50 border-2 border-white/30 focus:border-white/60 focus:outline-none transition-all text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-white font-medium block">
                  🏠 Quanto gasta em aluguel?
                </label>
                <input
                  type="number"
                  name="aluguel"
                  step="0.01"
                  required
                  placeholder="R$ 0,00"
                  className="w-full p-4 rounded-xl bg-white/20 backdrop-blur-sm text-white placeholder:text-white/50 border-2 border-white/30 focus:border-white/60 focus:outline-none transition-all text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-white font-medium block">
                  🛒 Quanto gasta em compras?
                </label>
                <input
                  type="number"
                  name="compras"
                  step="0.01"
                  required
                  placeholder="R$ 0,00"
                  className="w-full p-4 rounded-xl bg-white/20 backdrop-blur-sm text-white placeholder:text-white/50 border-2 border-white/30 focus:border-white/60 focus:outline-none transition-all text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-white font-medium block">
                  📝 Outros gastos mensais
                </label>
                <input
                  type="number"
                  name="outros"
                  step="0.01"
                  placeholder="R$ 0,00 (opcional)"
                  className="w-full p-4 rounded-xl bg-white/20 backdrop-blur-sm text-white placeholder:text-white/50 border-2 border-white/30 focus:border-white/60 focus:outline-none transition-all text-lg"
                />
              </div>

              <Button
                type="submit"
                disabled={savingQuestionnaire}
                className="w-full bg-white text-[#3D73FF] hover:bg-white/90 rounded-xl py-6 text-lg font-semibold mt-8 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingQuestionnaire ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  'Gerar Análise Financeira'
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
          <div>
            <p className="text-white/80 text-sm">Olá,</p>
            <h1 className="text-2xl font-bold">{userName}</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 rounded-full"
            onClick={() => router.push('/profile')}
          >
            <User className="h-6 w-6" />
          </Button>
        </div>

        {/* Balance Card - Clicável */}
        <button
          onClick={() => setShowQuestionnaire(true)}
          className="w-full bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/15 transition-all text-left"
        >
          <p className="text-white/80 text-sm mb-2">Saldo total</p>
          <p className="text-4xl font-bold mb-4">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data?.totalBalance || 0)}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/60 text-xs mb-1">Receitas</p>
              <p className="text-[#6AC96A] font-semibold flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data?.monthIncome || 0)}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-xs mb-1">Despesas</p>
              <p className="text-red-400 font-semibold flex items-center gap-1">
                <TrendingDown className="h-4 w-4" />
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data?.monthExpenses || 0)}
              </p>
            </div>
          </div>
        </button>

        {/* Gráfico de Pizza - Clicável para Dashboard Detalhado */}
        {financialData && (
          <button
            onClick={openDetailedDashboard}
            className="mt-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6 w-full text-left hover:bg-white/15 transition-all"
          >
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição Financeira
              <span className="ml-auto text-xs text-white/60">Clique para detalhes</span>
            </h3>
            <PieChartComponent data={financialData} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => router.push('/wallet/add-transaction')}
            className="h-24 bg-white hover:bg-gray-50 text-[#0A0A0A] rounded-2xl flex flex-col items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="h-6 w-6 text-[#3D73FF]" />
            <span className="text-sm font-medium">Nova Transação</span>
          </Button>
          <Button
            onClick={() => router.push('/goals/create')}
            className="h-24 bg-white hover:bg-gray-50 text-[#0A0A0A] rounded-2xl flex flex-col items-center justify-center gap-2 shadow-sm"
          >
            <Target className="h-6 w-6 text-[#3D73FF]" />
            <span className="text-sm font-medium">Nova Meta</span>
          </Button>
        </div>

        {/* Goals Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#0A0A0A]">Suas Metas</h2>
            <Link href="/goals" className="text-[#3D73FF] text-sm font-medium">
              Ver todas
            </Link>
          </div>
          {data?.goals && data.goals.length > 0 ? (
            <div className="space-y-3">
              {data.goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 text-center">
              <Target className="h-12 w-12 text-[#6C6C6C] mx-auto mb-3" />
              <p className="text-[#6C6C6C] mb-4">Você ainda não tem metas</p>
              <Button onClick={() => router.push('/goals/create')} className="bg-[#3D73FF] hover:bg-[#3D73FF]/90 rounded-xl">
                Criar primeira meta
              </Button>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#0A0A0A]">Transações Recentes</h2>
            <Link href="/wallet" className="text-[#3D73FF] text-sm font-medium">
              Ver todas
            </Link>
          </div>
          {data?.recentTransactions && data.recentTransactions.length > 0 ? (
            <div className="bg-white rounded-2xl divide-y">
              {data.recentTransactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 text-center">
              <Wallet className="h-12 w-12 text-[#6C6C6C] mx-auto mb-3" />
              <p className="text-[#6C6C6C]">Nenhuma transação registrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav currentPage="home" />
    </div>
  );
}

function PieChartComponent({ data }: { data: FinancialData }) {
  const total = data.aluguel + data.compras + data.outros;
  const aluguelPercent = total > 0 ? (data.aluguel / total) * 100 : 0;
  const comprasPercent = total > 0 ? (data.compras / total) * 100 : 0;
  const outrosPercent = total > 0 ? (data.outros / total) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/10 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-[#FF6B6B]"></div>
            <span className="text-white/80 text-xs">Aluguel</span>
          </div>
          <p className="text-white font-semibold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.aluguel)}
          </p>
          <p className="text-white/60 text-xs">{aluguelPercent.toFixed(1)}%</p>
        </div>

        <div className="bg-white/10 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-[#4ECDC4]"></div>
            <span className="text-white/80 text-xs">Compras</span>
          </div>
          <p className="text-white font-semibold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.compras)}
          </p>
          <p className="text-white/60 text-xs">{comprasPercent.toFixed(1)}%</p>
        </div>

        <div className="bg-white/10 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-[#FFD93D]"></div>
            <span className="text-white/80 text-xs">Outros</span>
          </div>
          <p className="text-white font-semibold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.outros)}
          </p>
          <p className="text-white/60 text-xs">{outrosPercent.toFixed(1)}%</p>
        </div>

        <div className="bg-white/10 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-[#6AC96A]"></div>
            <span className="text-white/80 text-xs">Economia</span>
          </div>
          <p className="text-white font-semibold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.economia)}
          </p>
        </div>
      </div>

      {/* Barra visual simplificada */}
      {total > 0 && (
        <div className="h-4 rounded-full overflow-hidden flex">
          <div className="bg-[#FF6B6B]" style={{ width: `${aluguelPercent}%` }}></div>
          <div className="bg-[#4ECDC4]" style={{ width: `${comprasPercent}%` }}></div>
          <div className="bg-[#FFD93D]" style={{ width: `${outrosPercent}%` }}></div>
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal }: { goal: any }) {
  const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
  
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-[#0A0A0A] mb-1">{goal.title}</h3>
          <p className="text-sm text-[#6C6C6C]">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.current_amount)} de{' '}
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.target_amount)}
          </p>
        </div>
        <span className="text-sm font-semibold text-[#3D73FF]">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-[#3D73FF] h-2 rounded-full transition-all"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}

function TransactionItem({ transaction }: { transaction: any }) {
  const isExpense = transaction.type === 'expense';
  
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isExpense ? 'bg-red-50' : 'bg-green-50'
        }`}>
          {isExpense ? (
            <TrendingDown className="h-5 w-5 text-red-500" />
          ) : (
            <TrendingUp className="h-5 w-5 text-green-500" />
          )}
        </div>
        <div>
          <p className="font-medium text-[#0A0A0A]">{transaction.description || transaction.category}</p>
          <p className="text-sm text-[#6C6C6C]">{new Date(transaction.date).toLocaleDateString('pt-BR')}</p>
        </div>
      </div>
      <p className={`font-semibold ${isExpense ? 'text-red-500' : 'text-green-500'}`}>
        {isExpense ? '-' : '+'}
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(transaction.amount))}
      </p>
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
