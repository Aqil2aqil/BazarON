import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  MapPin, 
  Star, 
  ShoppingBag, 
  Users, 
  ChevronLeft,
  Loader2,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { ref, onValue, query, orderByChild, equalTo, set, remove } from 'firebase/database';
import ProductList from './ProductList';

interface SellerProfileProps {
  sellerId: string;
  onBack: () => void;
  onAddToCart?: () => void;
  onProductSelect?: (product: any) => void;
}

interface SellerData {
  fullName: string;
  email: string;
  region?: string;
  bio?: string;
  photoURL?: string;
  role: string;
}

export default function SellerProfile({ sellerId, onBack, onAddToCart, onProductSelect }: SellerProfileProps) {
  const [seller, setSeller] = useState<SellerData | null>(null);
  const [stats, setStats] = useState({
    productCount: 0,
    avgRating: 0,
    followerCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const sellerRef = ref(db, `users/${sellerId}`);
    const unsubscribeSeller = onValue(sellerRef, (snapshot) => {
      setSeller(snapshot.val());
      setLoading(false);
    });

    // Product Count & Avg Rating
    const productsRef = ref(db, 'products');
    const sellerProductsQuery = query(productsRef, orderByChild('sellerId'), equalTo(sellerId));
    const unsubscribeProducts = onValue(sellerProductsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productsList = Object.keys(data);
        setStats(prev => ({ ...prev, productCount: productsList.length }));
        
        // Fetch all reviews for all products of this seller
        let totalRating = 0;
        let totalReviews = 0;
        let processedProducts = 0;

        productsList.forEach(pid => {
          const reviewsRef = ref(db, `product_reviews/${pid}`);
          onValue(reviewsRef, (revSnapshot) => {
            const reviewsData = revSnapshot.val();
            if (reviewsData) {
              const reviews = Object.values(reviewsData) as any[];
              reviews.forEach(r => {
                totalRating += r.rating;
                totalReviews++;
              });
            }
            processedProducts++;
            if (processedProducts === productsList.length && totalReviews > 0) {
              setStats(prev => ({ ...prev, avgRating: Number((totalRating / totalReviews).toFixed(1)) }));
            }
          }, { onlyOnce: true });
        });
      }
    });

    // Followers
    const followersRef = ref(db, `followers/${sellerId}`);
    const unsubscribeFollowers = onValue(followersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const count = Object.keys(data).length;
        setStats(prev => ({ ...prev, followerCount: count }));
        if (auth.currentUser) {
          setIsFollowing(!!data[auth.currentUser.uid]);
        }
      } else {
        setStats(prev => ({ ...prev, followerCount: 0 }));
        setIsFollowing(false);
      }
    });

    return () => {
      unsubscribeSeller();
      unsubscribeProducts();
      unsubscribeFollowers();
    };
  }, [sellerId]);

  const handleFollow = async () => {
    if (!auth.currentUser) {
      alert('İzləmək üçün daxil olun.');
      return;
    }
    
    const followerRef = ref(db, `followers/${sellerId}/${auth.currentUser.uid}`);
    const followingRef = ref(db, `following/${auth.currentUser.uid}/${sellerId}`);
    
    try {
      if (isFollowing) {
        await remove(followerRef);
        await remove(followingRef);
      } else {
        await set(followerRef, true);
        await set(followingRef, true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neon-purple animate-spin" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Satıcı tapılmadı</h2>
        <button onClick={onBack} className="text-neon-purple font-bold">Geri qayıt</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-50 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <h1 className="font-display font-bold text-lg truncate">{seller.fullName}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[350px_1fr] gap-8">
          {/* Sidebar: Seller Info */}
          <div className="space-y-6">
            <div className="glass p-8 rounded-[2.5rem] bg-white shadow-sm border-slate-100">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-slate-100 mb-4 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                  {seller.photoURL ? (
                    <img src={seller.photoURL} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-slate-300" />
                  )}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-display font-bold text-slate-900">{seller.fullName}</h2>
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-sm mb-6">
                  <MapPin className="w-4 h-4" />
                  <span>{seller.region || 'Azərbaycan'}</span>
                </div>

                <div className="grid grid-cols-3 gap-4 w-full mb-8">
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900">{stats.productCount}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Məhsul</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900">{stats.avgRating}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Reytinq</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900">{stats.followerCount}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">İzləyici</div>
                  </div>
                </div>

                <div className="flex gap-2 w-full">
                  <button 
                    onClick={handleFollow}
                    className={`flex-1 py-3 rounded-2xl font-bold transition-all ${
                      isFollowing 
                        ? 'bg-slate-100 text-slate-600' 
                        : 'bg-neon-purple text-white shadow-lg shadow-neon-purple/20 hover:bg-neon-purple/90'
                    }`}
                  >
                    {isFollowing ? 'İzlənilir' : 'İzlə'}
                  </button>
                  <button className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all">
                    <MessageSquare className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {seller.bio && (
                <div className="mt-8 pt-8 border-t border-slate-50">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Haqqında</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {seller.bio}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content: Products */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-display font-bold text-slate-900">Satıcının bütün məhsulları</h3>
              <div className="text-sm text-slate-400 font-medium">{stats.productCount} məhsul tapıldı</div>
            </div>

            <ProductList 
              sellerId={sellerId} 
              onAddToCart={onAddToCart}
              onProductSelect={onProductSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
