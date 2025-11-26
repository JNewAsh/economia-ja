"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      router.push('/dashboard');
    } else {
      router.push('/welcome');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFB]">
      <Loader2 className="h-8 w-8 animate-spin text-[#3D73FF]" />
    </div>
  );
}
