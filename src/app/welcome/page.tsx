"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, Target, Wallet, BookOpen } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3D73FF] to-[#0A0A0A] text-white">
      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl mb-6">
            <TrendingUp className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Mais controle.<br />Mais liberdade.
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto">
            Organize suas finanças, aprenda e alcance suas metas com o EconomiaJÁ
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-white text-[#0A0A0A] hover:bg-white/90 text-lg px-8 py-6 rounded-xl"
              onClick={() => router.push('/onboarding')}
            >
              Começar agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6 rounded-xl"
              onClick={() => router.push('/signin')}
            >
              Já tenho conta
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <FeatureCard
            icon={<Target className="w-8 h-8" />}
            title="Metas Inteligentes"
            description="Defina objetivos e acompanhe seu progresso automaticamente"
          />
          <FeatureCard
            icon={<Wallet className="w-8 h-8" />}
            title="Controle Total"
            description="Gerencie todas suas contas e cartões em um só lugar"
          />
          <FeatureCard
            icon={<BookOpen className="w-8 h-8" />}
            title="Educação Financeira"
            description="Aprenda com dicas práticas e quizzes interativos"
          />
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Análises em Tempo Real"
            description="Relatórios visuais e insights sobre seus gastos"
          />
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
          <div>
            <div className="text-4xl font-bold mb-2">10k+</div>
            <div className="text-white/70">Usuários ativos</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">R$ 2M+</div>
            <div className="text-white/70">Economizados</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">4.8★</div>
            <div className="text-white/70">Avaliação</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/15 transition-all">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-white/70">{description}</p>
    </div>
  );
}
