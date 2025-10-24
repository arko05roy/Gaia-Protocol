"use client"

import { useState, useEffect } from 'react';
import { Menu, X, Leaf } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-gaia-white border-b bg-white border-gaia-black"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight">GAIA</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('vision')} className="hover:opacity-60 transition-opacity">
              Vision
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:opacity-60 transition-opacity">
              How It Works
            </button>
            <button onClick={() => scrollToSection('proof-of-impact')} className="hover:opacity-60 transition-opacity">
              Proof of Impact
            </button>
            <button onClick={() => scrollToSection('desci')} className="hover:opacity-60 transition-opacity">
              DeSci
            </button>
            <button onClick={() => scrollToSection('ecosystem')} className="hover:opacity-60 transition-opacity">
              Ecosystem
            </button>
          </nav>

          <div className="hidden md:block">
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 bg-gaia-black text-gaia-yellow border-2 border-gaia-black hover:bg-transparent hover:text-gaia-black transition-all">
              Launch App
            </button>
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 flex flex-col gap-4">
            <button onClick={() => scrollToSection('vision')} className="text-left hover:opacity-60 transition-opacity">
              Vision
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-left hover:opacity-60 transition-opacity">
              How It Works
            </button>
            <button onClick={() => scrollToSection('proof-of-impact')} className="text-left hover:opacity-60 transition-opacity">
              Proof of Impact
            </button>
            <button onClick={() => scrollToSection('desci')} className="text-left hover:opacity-60 transition-opacity">
              DeSci
            </button>
            <button onClick={() => scrollToSection('ecosystem')} className="text-left hover:opacity-60 transition-opacity">
              Ecosystem
            </button>
            <button 
              onClick={() => {
                router.push('/dashboard');
                setIsMobileMenuOpen(false);
              }}
              className="px-6 py-2 bg-gaia-black text-gaia-yellow border-2 border-gaia-black hover:bg-transparent hover:text-gaia-black transition-all text-left">
              Launch App
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
