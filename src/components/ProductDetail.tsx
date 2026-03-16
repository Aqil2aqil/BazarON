import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  User, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  MessageSquare, 
  ShieldCheck, 
  RotateCcw,
  Send,
  Loader2
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { ref, onValue, push, set, get, update, remove, query, orderByChild, equalTo } from 'firebase/database';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  createdAt: number;
}

interface ProductMedia {
  images: string[];
  video?: string;
}

interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerRegion?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  media: ProductMedia;
  createdAt: any;
  discount?: number;
  stock?: number;
  sales?: number;
}

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  onAddToCart?: () => void;
  onSellerClick?: (sellerId: string) => void;
}

export default function ProductDetail({ product, onClose, onAddToCart, onSellerClick }: ProductDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [sellerInfo, setSellerInfo] = useState<{ fullName?: string; region?: string; role?: string; photoURL?: string } | null>(null);
  const [sellerStats, setSellerStats] = useState({
    productCount: 0,
    followerCount: 0,
    avgRating: 4.8 // Default or placeholder
  });

  useEffect(() => {
    if (!auth.currentUser) {
      setIsWishlisted(false);
      setHasPurchased(false);
      return;
    }

    // Wishlist status
    const wishlistRef = ref(db, `wishlist/${auth.currentUser.uid}/${product.id}`);
    const unsubscribeWishlist = onValue(wishlistRef, (snapshot) => {
      setIsWishlisted(!!snapshot.val());
    });

    // Purchase status for Review Guard
    const purchaseRef = ref(db, `purchases/${auth.currentUser.uid}/${product.id}`);
    const unsubscribePurchase = onValue(purchaseRef, (snapshot) => {
      setHasPurchased(!!snapshot.val());
    });

    return () => {
      unsubscribeWishlist();
      unsubscribePurchase();
    };
  }, [product.id]);

  useEffect(() => {
    // Seller Integrity: Fetch directly from /users/{uid}
    const sellerRef = ref(db, `users/${product.sellerId}`);
    const unsubscribeSeller = onValue(sellerRef, (snapshot) => {
      setSellerInfo(snapshot.val());
    });

    // Fetch Seller Stats
    const productsRef = ref(db, 'products');
    const sellerProductsQuery = query(productsRef, orderByChild('sellerId'), equalTo(product.sellerId));
    const unsubscribeProducts = onValue(sellerProductsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productsList = Object.keys(data);
        setSellerStats(prev => ({ ...prev, productCount: productsList.length }));

        // Calculate average rating across all seller's products
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
              setSellerStats(prev => ({ ...prev, avgRating: Number((totalRating / totalReviews).toFixed(1)) }));
            }
          }, { onlyOnce: true });
        });
      }
    });

    const followersRef = ref(db, `followers/${product.sellerId}`);
    const unsubscribeFollowers = onValue(followersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSellerStats(prev => ({ ...prev, followerCount: Object.keys(data).length }));
      }
    });

    return () => {
      unsubscribeSeller();
      unsubscribeProducts();
      unsubscribeFollowers();
    };
  }, [product.sellerId]);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) {
      setIsFollowing(false);
      return;
    }
    const followerRef = ref(db, `followers/${product.sellerId}/${auth.currentUser.uid}`);
    const unsubscribe = onValue(followerRef, (snapshot) => {
      setIsFollowing(!!snapshot.val());
    });
    return () => unsubscribe();
  }, [product.sellerId]);

  const handleFollow = async () => {
    if (!auth.currentUser) {
      alert('İzləmək üçün daxil olun.');
      return;
    }
    const followerRef = ref(db, `followers/${product.sellerId}/${auth.currentUser.uid}`);
    const followingRef = ref(db, `following/${auth.currentUser.uid}/${product.sellerId}`);
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

  const [averageRating, setAverageRating] = useState(0);
  useEffect(() => {
    const reviewsRef = ref(db, `product_reviews/${product.id}`);
    const unsubscribe = onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const reviewsList = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value
        })).sort((a, b) => b.createdAt - a.createdAt);
        setReviews(reviewsList);
        
        const avg = reviewsList.reduce((acc, curr) => acc + curr.rating, 0) / reviewsList.length;
        setAverageRating(avg);
      } else {
        setReviews([]);
        setAverageRating(0);
      }
    });

    return () => unsubscribe();
  }, [product.id]);

  const toggleWishlist = async () => {
    if (!auth.currentUser) {
      alert('Bəyənmək üçün daxil olun.');
      return;
    }
    const wishlistRef = ref(db, `wishlist/${auth.currentUser.uid}/${product.id}`);
    if (isWishlisted) {
      await remove(wishlistRef);
    } else {
      await set(wishlistRef, true);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert('Rəy bildirmək üçün daxil olun.');
      return;
    }
    if (!newReview.comment.trim()) return;

    setSubmittingReview(true);
    try {
      const reviewsRef = ref(db, `product_reviews/${product.id}`);
      const newReviewRef = push(reviewsRef);
      await set(newReviewRef, {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonim',
        userPhoto: auth.currentUser.photoURL,
        rating: newReview.rating,
        comment: newReview.comment,
        isVerified: hasPurchased,
        createdAt: Date.now()
      });
      setNewReview({ rating: 5, comment: '' });
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = async () => {
    if (!auth.currentUser) {
      alert('Səbətə əlavə etmək üçün daxil olun.');
      return;
    }

    try {
      const cartItemRef = ref(db, `carts/${auth.currentUser.uid}/${product.id}`);
      const snapshot = await get(cartItemRef);
      const currentQuantity = snapshot.val() || 0;
      
      await update(ref(db, `carts/${auth.currentUser.uid}`), {
        [product.id]: currentQuantity + 1
      });
      
      onAddToCart?.();
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-6xl bg-white sm:rounded-[2.5rem] shadow-2xl flex flex-col h-full sm:h-[90vh] overflow-hidden"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-white/90 backdrop-blur-md rounded-full text-slate-600 hover:text-slate-900 shadow-lg transition-all"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="flex flex-col md:flex-row">
            {/* Left: Image Gallery */}
            <div className="w-full md:w-[55%] bg-slate-50 relative">
              <div className="aspect-square relative group">
                <img 
                  src={product.media.images[currentImageIndex]} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                
                {product.media.images.length > 1 && (
                  <>
                    <button 
                      onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? product.media.images.length - 1 : prev - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-md rounded-full text-slate-900 shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => setCurrentImageIndex((prev) => (prev === product.media.images.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-md rounded-full text-slate-900 shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              <div className="p-4 flex gap-2 overflow-x-auto no-scrollbar">
                {product.media.images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                      currentImageIndex === idx ? 'border-neon-purple ring-2 ring-neon-purple/20' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Price/CTA */}
            <div className="w-full md:w-[45%] p-6 md:p-10 flex flex-col">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-neon-purple/10 text-neon-purple text-[10px] font-bold uppercase tracking-wider rounded-full">
                    {product.category}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{averageRating > 0 ? averageRating.toFixed(1) : 'Yeni'} ({reviews.length} rəy)</span>
                  </div>
                </div>
                <h1 className="text-3xl font-display font-bold text-slate-900 mb-3">{product.name}</h1>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-neon-purple">{product.price} ₼</span>
                  {product.discount ? (
                    <>
                      <span className="text-slate-400 line-through text-lg">{(product.price / (1 - product.discount / 100)).toFixed(2)} ₼</span>
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-xs font-bold rounded">-{product.discount}%</span>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Features */}
              <div className="mb-8">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Zəmanət</div>
                    <div className="text-xs font-bold text-slate-700">100% Təhlükəsiz</div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-3 mb-8">
                <button 
                  onClick={handleAddToCart}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                  <ShoppingCart className="w-6 h-6" />
                  Səbətə at
                </button>
                <button 
                  onClick={toggleWishlist}
                  className="w-full bg-white border-2 border-slate-100 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <Heart className={`w-6 h-6 transition-colors ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                  {isWishlisted ? 'Bəyənildi' : 'Bəyən'}
                </button>
              </div>

              {/* Seller Card */}
              <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div className="flex items-center gap-4 mb-4">
                  <button 
                    onClick={() => {
                      onClose();
                      onSellerClick?.(product.sellerId);
                    }}
                    className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden hover:ring-2 hover:ring-neon-purple transition-all"
                  >
                    {sellerInfo?.photoURL ? (
                      <img src={sellerInfo.photoURL} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Satıcı</div>
                    <button 
                      onClick={() => {
                        onClose();
                        onSellerClick?.(product.sellerId);
                      }}
                      className="font-bold text-slate-900 hover:text-neon-purple transition-colors"
                    >
                      {sellerInfo?.fullName || product.sellerName}
                    </button>
                    <div className="text-[10px] text-emerald-500 font-bold uppercase">
                      {sellerInfo?.region ? `${sellerInfo.region} Təsdiqlənmiş Satıcı` : 'Aktiv Satıcı'}
                    </div>
                  </div>
                  <button 
                    onClick={handleFollow}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isFollowing 
                        ? 'bg-slate-100 text-slate-600' 
                        : 'bg-white text-neon-purple border border-neon-purple/20 hover:bg-neon-purple hover:text-white'
                    }`}
                  >
                    {isFollowing ? 'İzlənilir' : 'İzlə'}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white rounded-xl">
                    <div className="text-[10px] text-slate-400 font-bold">Məhsul</div>
                    <div className="text-xs font-bold">{sellerStats.productCount}</div>
                  </div>
                  <div className="p-2 bg-white rounded-xl">
                    <div className="text-[10px] text-slate-400 font-bold">Reytinq</div>
                    <div className="text-xs font-bold">{sellerStats.avgRating}</div>
                  </div>
                  <div className="p-2 bg-white rounded-xl">
                    <div className="text-[10px] text-slate-400 font-bold">İzləyici</div>
                    <div className="text-xs font-bold">{sellerStats.followerCount}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Sections */}
          <div className="p-6 md:p-10 border-t border-slate-100">
            <div className="max-w-4xl mx-auto space-y-12">
              {/* Product Specs */}
              <section>
                <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-neon-purple" />
                  Məhsul Detalları
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-slate-600 leading-relaxed">
                      {product.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b border-slate-50">
                        <span className="text-slate-400 text-sm">Kateqoriya</span>
                        <span className="text-slate-900 font-bold text-sm">{product.category}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-50">
                        <span className="text-slate-400 text-sm">Region</span>
                        <span className="text-slate-900 font-bold text-sm">{product.sellerRegion || 'Bilinmir'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-50">
                        <span className="text-slate-400 text-sm">Material</span>
                        <span className="text-slate-900 font-bold text-sm">Təbii / Yerli</span>
                      </div>
                    </div>
                  </div>
                  {product.media.video && (
                    <div className="aspect-video rounded-3xl overflow-hidden bg-slate-900 shadow-xl">
                      <video 
                        src={product.media.video} 
                        controls 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* Reviews Section */}
              <section id="reviews">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-display font-bold flex items-center gap-2">
                    <Star className="w-6 h-6 text-amber-500" />
                    Rəylər ({reviews.length})
                  </h3>
                </div>

                {/* Add Review Form */}
                {auth.currentUser ? (
                  <form onSubmit={handleReviewSubmit} className="mb-10 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-sm font-bold text-slate-700">Qiymətləndirin:</div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewReview({ ...newReview, rating: star })}
                            className={`p-1 transition-all transform hover:scale-110 ${
                              star <= newReview.rating ? 'text-amber-500' : 'text-slate-300'
                            }`}
                          >
                            <Star className={`w-6 h-6 ${star <= newReview.rating ? 'fill-current' : ''}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="relative">
                      <textarea
                        value={newReview.comment}
                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                        placeholder="Məhsul haqqında fikirlərinizi bölüşün..."
                        className="w-full p-4 bg-white rounded-2xl border border-slate-100 outline-none focus:border-neon-purple min-h-[100px] transition-all"
                        required
                      />
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="absolute bottom-4 right-4 p-3 bg-neon-purple text-white rounded-xl shadow-lg hover:bg-neon-purple/90 transition-all disabled:opacity-50"
                      >
                        {submittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </button>
                    </div>
                  </form>
                ) : !auth.currentUser ? (
                  <div className="mb-10 p-6 bg-slate-50 rounded-3xl text-center border border-dashed border-slate-200">
                    <p className="text-slate-500 text-sm">Rəy bildirmək üçün daxil olun.</p>
                  </div>
                ) : null}

                {/* Reviews List */}
                <div className="space-y-6">
                  {reviews.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 italic">
                      Hələ rəy bildirilməyib. İlk rəyi siz bildirin!
                    </div>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="flex gap-4 p-6 bg-white rounded-3xl border border-slate-50 shadow-sm">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                          {review.userPhoto ? (
                            <img src={review.userPhoto} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-6 h-6 text-slate-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900">{review.userName}</h4>
                              {review.isVerified && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[8px] font-bold uppercase rounded-full">
                                  <ShieldCheck className="w-2.5 h-2.5" />
                                  Təsdiqlənmiş Alıcı
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                              {new Date(review.createdAt).toLocaleDateString('az-AZ')}
                            </span>
                          </div>
                          <div className="flex text-amber-500 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : ''}`} />
                            ))}
                          </div>
                          <p className="text-slate-600 text-sm leading-relaxed">
                            {review.comment}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Mobile Sticky CTA */}
        <div className="md:hidden p-4 bg-white/90 backdrop-blur-md border-t border-slate-100 flex gap-3 z-50">
          <button 
            onClick={handleAddToCart}
            className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
          >
            <ShoppingCart className="w-5 h-5" />
            Səbətə at
          </button>
          <button 
            onClick={toggleWishlist}
            className={`p-4 bg-slate-50 rounded-2xl active:scale-95 transition-transform ${isWishlisted ? 'text-rose-500' : 'text-slate-400'}`}
          >
            <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
