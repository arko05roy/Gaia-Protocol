"use client"
import { ArrowRight, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Hero() {
    const router = useRouter()
    return (
    <section id="vision" className="min-h-[60vh] bg-white flex items-center justify-center px-6 pt-32 pb-16">
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center space-y-6">
          <h1 className="text-6xl md:text-[12rem] font-serif font-bold leading-tight">
            Gaia
          </h1>
          <p className="text-3xl md:text-5xl font-serif leading-tight max-w-4xl mx-auto">
            An L3 Refi Protocol powered by Celo
          </p>

       

          <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
            onClick={() => router.push('/dashboard')}
            className="px-8 py-4 bg-gaia-black text-gaia-yellow border-2 border-gaia-black hover:bg-green-400 hover:text-white transition-all flex items-center gap-2 font-medium text-lg group">
              Launch App
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => router.push('/whitepaper')}
            className="px-8 py-4 bg-transparent text-gaia-black border-2 border-gaia-black hover:bg-green-400 hover:text-white transition-all flex items-center gap-2 font-medium text-lg">
              <FileText className="w-5 h-5" />
              Read Whitepaper
            </button>
          </div>
        </div>

        <div className="mt-16">
          <img src="/gaiahero.png" alt="Gaia Illustration" className="w-full rounded-xl shadow-lg brightness-125" />
        </div>

        <div className="mt-20">
          <p className="text-lg md:text-xl leading-relaxed max-w-5xl mx-auto text-center">
            Gaia, is the first blockchain for enviroment that allows you to Participate, Own, and Earn through Proof backed carbon credits, tokenized  incentives, and onchain prediction markets and an open DeSCI dataset.
          </p>
        </div>
      </div>
    </section>
  );
}
