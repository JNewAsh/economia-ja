"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Target, Loader2, TrendingUp } from 'lucide-react';

export default function GoalsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<any[]>([]);

  useEffect(() => {
    loadGoals();
  }, []);

  async function loadGoals() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push('/welcome');
      return;
    }

    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    setGoals(data || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFB]">
        <Loader2 className="h-8 w-8 animate-spin text-[#3D73FF]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFB] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-[#0A0A0A]">Metas</h1>
          </div>
          <Button
            onClick={() => router.push('/goals/create')}
            className="bg-[#3D73FF] hover:bg-[#3D73FF]/90 rounded-xl"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova Meta
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {goals.length > 0 ? (
          <div className="space-y-4">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onClick={() => router.push(`/goals/${goal.id}`)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <Target className="h-24 w-24 text-[#6C6C6C] mb-4" />
            <h2 className="text-xl font-bold text-[#0A0A0A] mb-2">Nenhuma meta criada</h2>
            <p className="text-[#6C6C6C] text-center mb-6 max-w-sm">
              Defina objetivos financeiros e acompanhe seu progresso automaticamente
            </p>
            <Button
              onClick={() => router.push('/goals/create')}
              className="bg-[#3D73FF] hover:bg-[#3D73FF]/90 rounded-xl"
            >
              <Plus className="h-5 w-5 mr-2" />
              Criar primeira meta
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function GoalCard({ goal, onClick }: { goal: any; onClick: () => void }) {
  const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
  const remaining = Number(goal.target_amount) - Number(goal.current_amount);
  
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-[#0A0A0A] mb-1">{goal.title}</h3>
          {goal.target_date && (
            <p className="text-sm text-[#6C6C6C]">
              Prazo: {new Date(goal.target_date).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          goal.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {goal.is_active ? 'Ativa' : 'Pausada'}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#6C6C6C]">Progresso</span>
          <span className="font-semibold text-[#3D73FF]">{Math.round(progress)}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-[#3D73FF] to-[#6AC96A] h-3 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#6C6C6C]">Atual</p>
            <p className="font-semibold text-[#0A0A0A]">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.current_amount)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#6C6C6C]">Meta</p>
            <p className="font-semibold text-[#0A0A0A]">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.target_amount)}
            </p>
          </div>
        </div>

        {remaining > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <TrendingUp className="h-4 w-4 text-[#3D73FF]" />
            <p className="text-sm text-[#6C6C6C]">
              Faltam <span className="font-semibold text-[#0A0A0A]">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(remaining)}
              </span>
            </p>
          </div>
        )}
      </div>
    </button>
  );
}
