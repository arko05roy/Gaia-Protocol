import { Leaf, Github, Twitter, Mail, FileText } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gaia-black text-gaia-yellow py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="w-8 h-8" />
              <span className="text-2xl font-bold tracking-tight">GAIA PROTOCOL</span>
            </div>
            <p className="text-lg leading-relaxed mb-6">
              A Layer 3 blockchain on Celo where transactions represent real-world environmental impact,
              verified through Proof of Impact consensus.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:opacity-60 transition-opacity">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="#" className="hover:opacity-60 transition-opacity">
                <Github className="w-6 h-6" />
              </a>
              <a href="#" className="hover:opacity-60 transition-opacity">
                <Mail className="w-6 h-6" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Protocol</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:opacity-60 transition-opacity">
                  Whitepaper
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-60 transition-opacity">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-60 transition-opacity">
                  GitHub
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-60 transition-opacity">
                  Tokenomics
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:opacity-60 transition-opacity">
                  Discord
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-60 transition-opacity">
                  Telegram
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-60 transition-opacity">
                  Forum
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-60 transition-opacity">
                  Blog
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gaia-yellow pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">© 2025 Gaia Protocol. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:opacity-60 transition-opacity">
              Privacy Policy
            </a>
            <a href="#" className="hover:opacity-60 transition-opacity">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
