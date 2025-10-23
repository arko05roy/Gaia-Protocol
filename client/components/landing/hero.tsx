import { ArrowRight, FileText } from 'lucide-react';

export default function Hero() {
  return (
    <section id="vision" className="min-h-screen bg-gaia-yellow flex items-center justify-center px-6 pt-24 pb-16">
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center space-y-8">
          <h1 className="text-6xl md:text-8xl font-serif font-bold leading-tight">
            Gaia Protocol
          </h1>

          <p className="text-3xl md:text-5xl font-serif leading-tight max-w-4xl mx-auto">
            Where transactions represent real-world action
          </p>

          <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
            A Layer 3 blockchain on top of Celo, powered by{' '}
            <span className="font-semibold">Proof of Impact</span> consensus
          </p>

          <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="px-8 py-4 bg-gaia-black text-gaia-yellow border-2 border-gaia-black hover:bg-transparent hover:text-gaia-black transition-all flex items-center gap-2 font-medium text-lg group">
              Launch App
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 bg-transparent text-gaia-black border-2 border-gaia-black hover:bg-gaia-black hover:text-gaia-yellow transition-all flex items-center gap-2 font-medium text-lg">
              <FileText className="w-5 h-5" />
              Read Whitepaper
            </button>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gaia-white border-2 border-gaia-black p-8 hover:translate-y-[-4px] transition-transform">
            <p className="text-sm font-medium mb-2">CONSENSUS</p>
            <p className="text-3xl font-serif font-bold">Proof of Impact</p>
          </div>
          <div className="bg-gaia-white border-2 border-gaia-black p-8 hover:translate-y-[-4px] transition-transform">
            <p className="text-sm font-medium mb-2">LAYER</p>
            <p className="text-3xl font-serif font-bold">Layer 3 on Celo</p>
          </div>
          <div className="bg-gaia-white border-2 border-gaia-black p-8 hover:translate-y-[-4px] transition-transform">
            <p className="text-sm font-medium mb-2">CURRENCY</p>
            <p className="text-3xl font-serif font-bold">cUSD</p>
          </div>
        </div>
      </div>
    </section>
  );
}
