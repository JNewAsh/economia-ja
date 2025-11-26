"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Mail, CreditCard, LogOut, Loader2, Shield, Bell } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push('/welcome');
      return;
    }

    setUser(session.user);

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    setSubscription(sub);
    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/welcome');
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFB]">
        <Loader2 className="h-8 w-8 animate-spin text-[#3D73FF]" />
      </div>
    );
  }

  const planLabels = {
    free: 'Gratuito',
    basic: 'Básico',
    premium: 'Premium'
  };

  return (
    <div className="min-h-screen bg-[#FAFAFB] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#3D73FF] to-[#0A0A0A] text-white p-6 rounded-b-3xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-white hover:bg-white/10 rounded-xl mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
            <User className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user?.user_metadata?.name || 'Usuário'}</h1>
            <p className="text-white/80">{user?.email}</p>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">Plano atual</p>
              <p className="text-xl font-bold">{planLabels[subscription?.plan as keyof typeof planLabels] || 'Gratuito'}</p>
            </div>
            <Button
              onClick={() => router.push('/plans')}
              variant="outline"
              className="border-white text-white hover:bg-white/10 rounded-xl"
            >
              Upgrade
            </Button>
          </div>
        </div>
      </div>

      {/* Menu Options */}
      <div className="p-6 space-y-4">
        <div className="bg-white rounded-2xl divide-y shadow-sm">
          <MenuOption
            icon={<User className="h-5 w-5" />}
            title="Dados pessoais"
            description="Edite suas informações"
            onClick={() => router.push('/profile/edit')}
          />
          <MenuOption
            icon={<CreditCard className="h-5 w-5" />}
            title="Assinatura"
            description="Gerencie seu plano"
            onClick={() => router.push('/plans')}
          />
          <MenuOption
            icon={<Bell className="h-5 w-5" />}
            title="Notificações"
            description="Configure alertas"
            onClick={() => router.push('/profile/notifications')}
          />
          <MenuOption
            icon={<Shield className="h-5 w-5" />}
            title="Privacidade e segurança"
            description="Controle seus dados"
            onClick={() => router.push('/profile/privacy')}
          />
        </div>

        {/* Sign Out Button */}
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
        >
          <LogOut className="mr-2 h-5 w-5" />
          Sair da conta
        </Button>

        {/* App Info */}
        <div className="text-center text-sm text-[#6C6C6C] pt-4">
          <p>EconomiaJÁ v1.0.0</p>
          <p className="mt-1">Construindo um futuro financeiro melhor</p>
        </div>
      </div>
    </div>
  );
}

function MenuOption({ icon, title, description, onClick }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
    >
      <div className="w-10 h-10 bg-[#3D73FF]/10 rounded-full flex items-center justify-center text-[#3D73FF]">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className="font-semibold text-[#0A0A0A]">{title}</p>
        <p className="text-sm text-[#6C6C6C]">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-[#6C6C6C]" />
    </button>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
