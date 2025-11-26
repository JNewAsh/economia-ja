"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Loader2, ChevronRight } from 'lucide-react';

export default function TipsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tips, setTips] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadTips();
  }, [filter]);

  async function loadTips() {
    let query = supabase.from('tips').select('*').order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('level', filter);
    }

    const { data } = await query;
    setTips(data || []);
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
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-xl"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-[#0A0A0A]">Dicas Financeiras</h1>
        </div>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'Todas' },
            { value: 'basic', label: 'Básico' },
            { value: 'intermediate', label: 'Intermediário' },
            { value: 'advanced', label: 'Avançado' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                filter === option.value
                  ? 'bg-[#3D73FF] text-white'
                  : 'bg-gray-100 text-[#6C6C6C]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {tips.length > 0 ? (
          <div className="space-y-4">
            {tips.map((tip) => (
              <TipCard key={tip.id} tip={tip} onClick={() => router.push(`/tips/${tip.id}`)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-24 w-24 text-[#6C6C6C] mb-4" />
            <h2 className="text-xl font-bold text-[#0A0A0A] mb-2">Nenhuma dica encontrada</h2>
            <p className="text-[#6C6C6C] text-center">
              Tente outro filtro
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TipCard({ tip, onClick }: { tip: any; onClick: () => void }) {
  const levelColors = {
    basic: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700'
  };

  const levelLabels = {
    basic: 'Básico',
    intermediate: 'Intermediário',
    advanced: 'Avançado'
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-[#0A0A0A] mb-2">{tip.title}</h3>
          <p className="text-sm text-[#6C6C6C] line-clamp-2">{tip.body}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-[#6C6C6C] flex-shrink-0 ml-2" />
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${levelColors[tip.level as keyof typeof levelColors]}`}>
          {levelLabels[tip.level as keyof typeof levelLabels]}
        </span>
        {tip.category && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {tip.category}
          </span>
        )}
      </div>
    </button>
  );
}
