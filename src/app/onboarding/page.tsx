"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Target, PiggyBank, TrendingUp } from 'lucide-react';

const steps = [
  {
    icon: <Target className="w-16 h-16" />,
    title: "Defina suas metas",
    description: "Crie objetivos financeiros claros e acompanhe seu progresso em tempo real. Seja para uma viagem, comprar algo especial ou criar uma reserva de emergência."
  },
  {
    icon: <PiggyBank className="w-16 h-16" />,
    title: "Controle seus gastos",
    description: "Registre todas suas transações e veja relatórios detalhados. Entenda para onde seu dinheiro está indo e tome decisões mais inteligentes."
  },
  {
    icon: <TrendingUp className="w-16 h-16" />,
    title: "Aprenda e cresça",
    description: "Acesse dicas práticas, faça quizzes interativos e desenvolva hábitos financeiros saudáveis. Educação financeira que realmente funciona."
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push('/signup');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.push('/welcome');
    }
  };

  const step = steps[currentStep];

  return (
    <div className="min-h-screen bg-[#FAFAFB] flex flex-col">
      {/* Progress Bar */}
      <div className="w-full h-1 bg-gray-200">
        <div 
          className="h-full bg-[#3D73FF] transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-32 h-32 bg-[#3D73FF]/10 rounded-full mb-8 text-[#3D73FF]">
            {step.icon}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-[#0A0A0A] mb-4">
            {step.title}
          </h1>

          {/* Description */}
          <p className="text-lg text-[#6C6C6C] mb-12">
            {step.description}
          </p>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep 
                    ? 'w-8 bg-[#3D73FF]' 
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handleBack}
              className="flex-1 rounded-xl"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Voltar
            </Button>
            <Button
              size="lg"
              onClick={handleNext}
              className="flex-1 bg-[#3D73FF] hover:bg-[#3D73FF]/90 rounded-xl"
            >
              {currentStep === steps.length - 1 ? 'Começar' : 'Próximo'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Skip Button */}
          <button
            onClick={() => router.push('/signup')}
            className="mt-6 text-[#6C6C6C] hover:text-[#0A0A0A] transition-colors"
          >
            Pular introdução
          </button>
        </div>
      </div>
    </div>
  );
}
