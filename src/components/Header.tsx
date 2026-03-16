import { ShoppingBag, User } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';

interface HeaderProps {
  onOpenAuth: () => void;
  onNavigate: (page: 'home' | 'profile') => void;
  onSearch: (term: string) => void;
  onOpenCart: () => void;
}

export default function Header({ onOpenAuth, onNavigate, onSearch, onOpenCart }: HeaderProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const cartRef = ref(db, `carts/${currentUser.uid}`);
        onValue(cartRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const count = Object.values(data).reduce((acc: number, curr: any) => acc + curr, 0);
            setCartCount(count);
          } else {
            setCartCount(0);
          }
        });
      } else {
        setCartCount(0);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch(value);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      {/* Main Header */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 sm:gap-8">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => onNavigate('home')}>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-neon-purple to-neon-blue rounded-lg flex items-center justify-center neon-glow-purple">
            <ShoppingBag className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <span className="text-xl sm:text-2xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-purple to-neon-blue hidden xs:block">
            BazarON
          </span>
        </div>

        {/* Utility Icons */}
        <div className="flex items-center gap-2 sm:gap-5">
          {/* Profile */}
          <button 
            onClick={() => user ? onNavigate('profile') : onOpenAuth()}
            className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-neon-purple transition-colors group"
          >
            <div className="relative">
              {user?.photoURL ? (
                <img src={user.photoURL} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <span className="text-[10px] font-bold uppercase hidden sm:block">Profil</span>
          </button>

          {/* Cart */}
          <button 
            onClick={onOpenCart}
            className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-neon-purple transition-colors relative"
          >
            <div className="relative">
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-neon-purple text-white text-[8px] font-bold flex items-center justify-center rounded-full border-2 border-white">{cartCount}</span>
              )}
            </div>
            <span className="text-[10px] font-bold uppercase hidden sm:block">Səbət</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
