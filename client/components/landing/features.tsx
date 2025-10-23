import { Satellite, Radio, MapPin, Shield } from 'lucide-react';

export default function ProofOfImpact() {
  const verificationMethods = [
    { icon: MapPin, label: 'GPS Coordinates' },
    { icon: Satellite, label: 'Drone Footage' },
    { icon: Radio, label: 'IoT Data' },
    { icon: Shield, label: 'Smart Contracts' },
  ];

  return (
    <section id="proof-of-impact" className="bg-gaia-yellow py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6">
            Proof of Impact
          </h2>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed mb-8">
            This verification is our consensus. It's no longer just Proof of Work or Proof of Stake — it's{' '}
            <span className="font-bold">Proof of Impact</span>.
          </p>
        </div>

        <div className="bg-gaia-black text-gaia-yellow border-2 border-gaia-black p-12 mb-12 text-center">
          <p className="text-3xl md:text-4xl font-serif font-bold leading-tight">
            The chain literally advances when the real world improves
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {verificationMethods.map((method, index) => (
            <div
              key={index}
              className="bg-gaia-white border-2 border-gaia-black p-8 text-center hover:translate-y-[-4px] transition-transform"
            >
              <method.icon className="w-12 h-12 mx-auto mb-4" />
              <p className="font-semibold">{method.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gaia-white border-2 border-gaia-black p-8">
            <h3 className="text-2xl font-serif font-bold mb-4">Evidence Submission</h3>
            <p className="text-lg leading-relaxed">
              When Node Operators complete a task, they submit comprehensive evidence including GPS coordinates,
              timestamped drone footage, and IoT sensor data — all recorded immutably on-chain.
            </p>
          </div>
          <div className="bg-gaia-white border-2 border-gaia-black p-8">
            <h3 className="text-2xl font-serif font-bold mb-4">Oracle Verification</h3>
            <p className="text-lg leading-relaxed">
              Smart contracts and oracles automatically verify submitted evidence against predefined criteria,
              ensuring only genuine impact advances the blockchain state.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
