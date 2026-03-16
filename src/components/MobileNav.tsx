import React from 'react';
import { Home, ShoppingBag, ShoppingCart, User } from 'lucide-react';

interface MobileNavProps {
  currentPage: 'home' | 'profile' | 'seller';
  onNavigate: (page: 'home' | 'profile' | 'seller') => void;
  onOpenCart: () => void;
}

export default function MobileNav({ currentPage, onNavigate, onOpenCart }: MobileNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] px-4 pb-4">
      <nav className="glass rounded-2xl p-2 flex items-center justify-around shadow-2xl border border-white/20">
        <button 
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
            currentPage === 'home' ? 'text-neon-purple bg-neon-purple/10' : 'text-slate-400'
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Ana Səhifə</span>
        </button>

        <button 
          className="flex flex-col items-center gap-1 p-2 rounded-xl text-slate-400"
        >
          <ShoppingBag className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Bazarlar</span>
        </button>

        <button 
          onClick={onOpenCart}
          className="flex flex-col items-center gap-1 p-2 rounded-xl text-slate-400"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Səbət</span>
        </button>

        <button 
          onClick={() => onNavigate('profile')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
            currentPage === 'profile' ? 'text-neon-purple bg-neon-purple/10' : 'text-slate-400'
          }`}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Profil</span>
        </button>
      </nav>
    </div>
  );
}
