import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingCart, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { ref, onValue, update, remove, get } from 'firebase/database';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  sellerName: string;
}

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  onOrderComplete?: () => void;
  onProductClick?: (productId: string) => void;
}

export default function Cart({ isOpen, onClose, onOpen, onOrderComplete, onProductClick }: CartProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const cartRef = ref(db, `carts/${user.uid}`);
    const unsubscribe = onValue(cartRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const cartItems: CartItem[] = [];
        for (const [productId, quantity] of Object.entries(data)) {
          // Fetch product details for each item in cart
          const productRef = ref(db, `products/${productId}`);
          const productSnap = await get(productRef);
          const productData = productSnap.val();
          
          if (productData) {
            cartItems.push({
              id: productId,
              name: productData.name,
              price: productData.price,
              image: productData.media.images[0],
              quantity: quantity as number,
              sellerName: productData.sellerName
            });
          }
        }
        setItems(cartItems);
      } else {
        setItems([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateQuantity = async (productId: string, delta: number) => {
    if (!user) return;
    const item = items.find(i => i.id === productId);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    const cartItemRef = ref(db, `carts/${user.uid}/${productId}`);

    if (newQuantity <= 0) {
      await remove(cartItemRef);
    } else {
      await update(ref(db, `carts/${user.uid}`), {
        [productId]: newQuantity
      });
    }
  };

  const removeItem = async (productId: string) => {
    if (!user) return;
    await remove(ref(db, `carts/${user.uid}/${productId}`));
  };

  const handleCheckout = async () => {
    if (!user || items.length === 0) return;
    setCompleting(true);

    try {
      // Add each item to /purchases/{uid}/{productId}
      const updates: any = {};
      items.forEach(item => {
        updates[`purchases/${user.uid}/${item.id}`] = {
          purchasedAt: Date.now(),
          quantity: item.quantity
        };
      });

      // Clear cart
      updates[`carts/${user.uid}`] = null;

      await update(ref(db), updates);
      
      onOrderComplete?.();
      onClose();
    } catch (error) {
      console.error('Error completing order:', error);
      alert('Sifariş zamanı xəta baş verdi.');
    } finally {
      setCompleting(false);
    }
  };

  const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <>
      {/* Floating Cart Icon */}
      <button 
        onClick={onOpen}
        className="fixed right-6 bottom-24 md:bottom-6 z-[60] p-4 bg-slate-900 text-white rounded-full shadow-2xl hover:scale-110 transition-all active:scale-95 group neon-glow-purple"
      >
        <div className="relative">
          <ShoppingCart className="w-6 h-6" />
          {items.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-neon-purple text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900 animate-in zoom-in duration-300">
              {items.reduce((acc, i) => acc + i.quantity, 0)}
            </span>
          )}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />

            {/* Full-screen Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 bg-slate-50 z-[101] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="bg-white border-b border-slate-200 px-4 py-4 sm:px-6 flex items-center justify-between shadow-sm">
                <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-neon-purple/10 rounded-xl">
                      <ShoppingCart className="w-5 h-5 text-neon-purple" />
                    </div>
                    <h2 className="text-xl font-display font-bold text-slate-900">Səbətim ({items.length})</h2>
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
                <div className="max-w-4xl mx-auto w-full h-full">
                  {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-neon-purple animate-spin" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-slate-200" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Səbətiniz boşdur</h3>
                      <p className="text-sm text-slate-500">Alış-verişə başlamaq üçün məhsullara baxın.</p>
                    </div>
                    <button 
                      onClick={onClose}
                      className="px-6 py-3 bg-gradient-to-r from-neon-purple to-neon-cyan text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-neon-purple/20"
                    >
                      Kəşf etməyə başla
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4 group">
                        <button 
                          onClick={() => {
                            onClose();
                            onProductClick?.(item.id);
                          }}
                          className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100 hover:ring-2 hover:ring-neon-purple transition-all relative group/img"
                        >
                          <img src={item.image} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[8px] text-white font-bold uppercase tracking-tighter">Səbətdən keçid</span>
                          </div>
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <button 
                              onClick={() => {
                                onClose();
                                onProductClick?.(item.id);
                              }}
                              className="font-bold text-slate-900 text-sm truncate pr-2 hover:text-neon-purple transition-colors text-left"
                            >
                              {item.name}
                              <span className="block text-[9px] text-neon-purple font-bold uppercase mt-0.5">Məhsula bax</span>
                            </button>
                            <button 
                              onClick={() => removeItem(item.id)}
                              className="text-slate-300 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase mb-2">{item.sellerName}</div>
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-neon-purple text-sm">{item.price} ₼</div>
                            <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                              <button 
                                onClick={() => updateQuantity(item.id, -1)}
                                className="p-1 hover:bg-white rounded-md transition-all text-slate-500"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, 1)}
                                className="p-1 hover:bg-white rounded-md transition-all text-slate-500"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="bg-white border-t border-slate-200 p-4 sm:p-6 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                  <div className="max-w-4xl mx-auto w-full space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Cəmi</span>
                      <span className="text-2xl font-bold text-slate-900">{total.toFixed(2)} ₼</span>
                    </div>
                    <button 
                      onClick={handleCheckout}
                      disabled={completing}
                      className="w-full bg-gradient-to-r from-neon-purple to-neon-cyan text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-neon-purple/20 group disabled:opacity-50"
                    >
                      {completing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Alış-verişi Tamamla
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-center text-slate-400 font-medium">
                      Çatdırılma və vergilər ödəniş zamanı hesablanacaq.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
