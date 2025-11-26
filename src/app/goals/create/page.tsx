"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Target, Loader2 } from 'lucide-react';

export default function CreateGoalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    target_amount: '',
    target_date: '',
    auto_contribution: '',
    frequency: 'monthly'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase.from('goals').insert({
        user_id: session.user.id,
        title: formData.title,
        target_amount: parseFloat(formData.target_amount),
        target_date: formData.target_date || null,
        auto_contribution: parseFloat(formData.auto_contribution) || 0,
        frequency: formData.frequency,
        current_amount: 0,
        is_active: true
      });

      if (error) throw error;

      router.push('/goals');
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      alert('Erro ao criar meta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFB]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-xl"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-[#0A0A0A]">Nova Meta</h1>
        </div>
      </div>

      {/* Form */}
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#3D73FF]/10 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-[#3D73FF]" />
              </div>
              <div>
                <h2 className="font-bold text-[#0A0A0A]">Defina sua meta</h2>
                <p className="text-sm text-[#6C6C6C]">Preencha os detalhes abaixo</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Nome da meta *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Viagem para Europa, Reserva de emergência"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-12 rounded-xl"
                  required
                />
              </div>

              {/* Target Amount */}
              <div className="space-y-2">
                <Label htmlFor="target_amount">Valor da meta *</Label>
                <Input
                  id="target_amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                  className="h-12 rounded-xl"
                  required
                />
              </div>

              {/* Target Date */}
              <div className="space-y-2">
                <Label htmlFor="target_date">Data limite (opcional)</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>

              {/* Auto Contribution */}
              <div className="space-y-2">
                <Label htmlFor="auto_contribution">Contribuição automática (opcional)</Label>
                <Input
                  id="auto_contribution"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.auto_contribution}
                  onChange={(e) => setFormData({ ...formData, auto_contribution: e.target.value })}
                  className="h-12 rounded-xl"
                />
                <p className="text-sm text-[#6C6C6C]">
                  Valor que será automaticamente reservado para esta meta
                </p>
              </div>

              {/* Frequency */}
              <div className="space-y-2">
                <Label>Frequência da contribuição</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'weekly', label: 'Semanal' },
                    { value: 'monthly', label: 'Mensal' },
                    { value: 'one-time', label: 'Única' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, frequency: option.value })}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        formData.frequency === option.value
                          ? 'border-[#3D73FF] bg-[#3D73FF]/5 text-[#3D73FF] font-semibold'
                          : 'border-gray-200 text-[#6C6C6C]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#3D73FF] hover:bg-[#3D73FF]/90 rounded-xl text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Criando meta...
                  </>
                ) : (
                  'Criar meta'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
