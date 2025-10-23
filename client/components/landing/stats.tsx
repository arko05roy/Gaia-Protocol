import { Brain, Database, TrendingUp, Zap } from 'lucide-react';

export default function DeSci() {
  return (
    <section id="desci" className="bg-gaia-yellow py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6">
            Self-Learning Blockchain
          </h2>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
            Where humans, markets, and AI collaborate to verify reality
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gaia-white border-2 border-gaia-black p-10">
            <Database className="w-12 h-12 mb-6" />
            <h3 className="text-3xl font-serif font-bold mb-4">Data Collection</h3>
            <p className="text-lg leading-relaxed">
              Every verified task feeds its data into our DeSci layer, building a comprehensive dataset
              of what success and fraud look like across different impact categories.
            </p>
          </div>

          <div className="bg-gaia-white border-2 border-gaia-black p-10">
            <Brain className="w-12 h-12 mb-6" />
            <h3 className="text-3xl font-serif font-bold mb-4">AI Training</h3>
            <p className="text-lg leading-relaxed">
              Machine learning models are trained on verified impact data, learning to identify patterns
              of genuine environmental restoration versus fraudulent submissions.
            </p>
          </div>
        </div>

        <div className="bg-gaia-black text-gaia-yellow border-2 border-gaia-black p-12 mb-12 text-center">
          <p className="text-3xl md:text-4xl font-serif font-bold leading-tight mb-8">
            AI models can be staked as validators themselves, earning yield when they accurately predict outcomes
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <div className="bg-gaia-yellow text-gaia-black px-8 py-4 border-2 border-gaia-yellow">
              <p className="text-sm font-medium mb-1">MODEL ACCURACY</p>
              <p className="text-4xl font-bold font-mono">94.7%</p>
            </div>
            <div className="bg-gaia-yellow text-gaia-black px-8 py-4 border-2 border-gaia-yellow">
              <p className="text-sm font-medium mb-1">STAKED MODELS</p>
              <p className="text-4xl font-bold font-mono">1,247</p>
            </div>
            <div className="bg-gaia-yellow text-gaia-black px-8 py-4 border-2 border-gaia-yellow">
              <p className="text-sm font-medium mb-1">AVG YIELD</p>
              <p className="text-4xl font-bold font-mono">12.3%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gaia-light-green border-2 border-gaia-black p-8 flex items-start gap-4 hover:translate-y-[-4px] transition-transform">
            <TrendingUp className="w-10 h-10 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-serif font-bold mb-3">Continuous Improvement</h3>
              <p className="text-lg leading-relaxed">
                As more tasks are verified, AI models become increasingly accurate, creating a flywheel
                of improved verification efficiency.
              </p>
            </div>
          </div>
          <div className="bg-gaia-light-green border-2 border-gaia-black p-8 flex items-start gap-4 hover:translate-y-[-4px] transition-transform">
            <Zap className="w-10 h-10 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-serif font-bold mb-3">Automated Verification</h3>
              <p className="text-lg leading-relaxed">
                Over time, AI validators handle routine verifications instantly, while complex cases
                receive human oversight.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
