import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Heart, Eye, Play, Star, MapPin, User, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { db } from '../lib/firebase';
import { ref, onValue, get, update, remove, set } from 'firebase/database';
import { auth } from '../lib/firebase';
import ProductDetail from './ProductDetail';
import { CATEGORIES } from '../constants';

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
}

interface ProductListProps {
  searchTerm?: string;
  initialCategory?: string;
  sellerId?: string;
  onAddToCart?: () => void;
  onSellerClick?: (sellerId: string) => void;
  onProductSelect?: (product: any) => void;
}

interface ProductCardProps {
  key?: string | number;
  product: Product;
  onSelect: (product: Product) => void;
  hoveredProduct: string | null;
  setHoveredProduct: (id: string | null) => void;
  handleTouchStart: (id: string) => void;
  handleTouchEnd: () => void;
  onAddToCart?: () => void;
  onSellerClick?: (sellerId: string) => void;
}

const ProductCard = ({ 
  product, 
  onSelect, 
  hoveredProduct, 
  setHoveredProduct, 
  handleTouchStart, 
  handleTouchEnd,
  onAddToCart,
  onSellerClick
}: ProductCardProps) => {
  const [rating, setRating] = useState({ avg: 0, count: 0 });
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [sellerInfo, setSellerInfo] = useState<{ name: string; region: string } | null>(null);

  useEffect(() => {
    const sellerRef = ref(db, `users/${product.sellerId}`);
    const unsubscribe = onValue(sellerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSellerInfo({
          name: data.displayName || data.fullName || 'Naməlum Satıcı',
          region: data.region || 'Yerli Bazar'
        });
      }
    });
    return () => unsubscribe();
  }, [product.sellerId]);

  useEffect(() => {
    if (!auth.currentUser) {
      setIsWishlisted(false);
      return;
    }
    const wishlistRef = ref(db, `wishlist/${auth.currentUser.uid}/${product.id}`);
    const unsubscribe = onValue(wishlistRef, (snapshot) => {
      setIsWishlisted(!!snapshot.val());
    });
    return () => unsubscribe();
  }, [product.id]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  useEffect(() => {
    const reviewsRef = ref(db, `product_reviews/${product.id}`);
    const unsubscribe = onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const reviews = Object.values(data) as any[];
        const avg = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
        setRating({ avg, count: reviews.length });
      } else {
        setRating({ avg: 0, count: 0 });
      }
    });
    return () => unsubscribe();
  }, [product.id]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onMouseEnter={() => setHoveredProduct(product.id)}
      onMouseLeave={() => setHoveredProduct(null)}
      onTouchStart={() => handleTouchStart(product.id)}
      onTouchEnd={handleTouchEnd}
      onClick={() => onSelect(product)}
      className="group bg-white/40 backdrop-blur-xl rounded-2xl overflow-hidden flex flex-col h-full hover:shadow-[0_0_30px_rgba(176,38,255,0.15)] transition-all border border-white/40 hover:border-neon-purple/50 cursor-pointer relative shadow-sm"
    >
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        {hoveredProduct === product.id && product.media.video ? (
          <video 
            src={product.media.video} 
            autoPlay 
            muted 
            loop 
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img 
            src={product.media.images[0]} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        
        {/* Price Badge */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          <div className="px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-md shadow-lg">
            {product.price} ₼
          </div>
          {product.discount ? (
            <div className="px-1.5 py-1 bg-red-500 text-white text-[10px] font-bold rounded-md shadow-lg">
              -{product.discount}%
            </div>
          ) : null}
        </div>

        {/* Wishlist Button */}
        <button 
          onClick={toggleWishlist}
          className="absolute top-2 left-2 p-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-lg transition-all active:scale-90 z-10"
        >
          <Heart className={`w-3.5 h-3.5 transition-colors ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
        </button>

        {product.media.video && !hoveredProduct && (
          <div className="absolute top-2 right-2 p-1 bg-black/40 backdrop-blur-md rounded-full text-white">
            <Play className="w-2.5 h-2.5 fill-current" />
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-grow">
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 mb-1 group-hover:text-neon-purple transition-colors">{product.name}</h3>
        
        <div className="flex items-center gap-1 text-amber-500 mb-2">
          <Star className="w-2.5 h-2.5 fill-current" />
          <span className="text-[9px] font-bold">{rating.avg > 0 ? rating.avg.toFixed(1) : 'Yeni'}</span>
          <span className="text-[9px] text-slate-400 font-normal ml-1">({rating.count})</span>
        </div>

        <div className="mt-auto pt-2 border-t border-slate-100/50 flex items-center justify-between">
          <div className="flex flex-col">
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onSellerClick?.(product.sellerId);
              }}
              className="flex items-center gap-1 mb-0.5 hover:text-neon-purple transition-colors"
            >
              <User className="w-2.5 h-2.5 text-slate-400" />
              <span className="text-[8px] font-bold text-slate-500 truncate max-w-[60px]">
                {sellerInfo?.name || 'Yüklənir...'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 text-neon-purple" />
              <span className="text-[9px] font-medium text-slate-500 truncate max-w-[70px]">
                {sellerInfo?.region ? `${sellerInfo.region} Bazarı` : 'Yerli Bazar'}
              </span>
            </div>
          </div>
          <button 
            onClick={handleAddToCart}
            className="p-1.5 bg-slate-100 rounded-full text-slate-400 hover:bg-neon-purple hover:text-white transition-colors"
          >
            <ShoppingCart className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProductList({ 
  searchTerm = '', 
  initialCategory = 'Hamısı', 
  sellerId,
  onAddToCart,
  onSellerClick,
  onProductSelect
}: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialCategory);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [touchTimer, setTouchTimer] = useState<NodeJS.Timeout | null>(null);

  const handleTouchStart = (productId: string) => {
    const timer = setTimeout(() => {
      setHoveredProduct(productId);
    }, 500); // 500ms for long press
    setTouchTimer(timer);
  };

  const handleTouchEnd = () => {
    if (touchTimer) {
      clearTimeout(touchTimer);
      setTouchTimer(null);
    }
    setHoveredProduct(null);
  };

  useEffect(() => {
    setFilter(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    const productsRef = ref(db, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productList = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value
        })).sort((a, b) => b.createdAt - a.createdAt);
        
        if (sellerId) {
          setProducts(productList.filter(p => p.sellerId === sellerId));
        } else {
          setProducts(productList);
        }
      } else {
        setProducts([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sellerId]);

  const categories = ['Hamısı', ...CATEGORIES];
  
  const filteredProducts = products.filter(p => {
    const matchesCategory = filter === 'Hamısı' || p.category === filter;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-12 h-12 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto relative" id="products">
      {/* Background Accents */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-neon-purple/5 blur-[100px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-neon-blue/5 blur-[100px] -z-10" />

      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-neon-purple to-neon-blue">Məhsul Vitrini</h2>
          <p className="text-slate-500 text-sm">BazarON-da ən son əlavə olunan təzə məhsullar.</p>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filter === cat 
                  ? 'bg-neon-purple text-white shadow-lg neon-glow-purple' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 glass rounded-[3rem]">
          <ShoppingCart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-400">Hələ ki məhsul yoxdur.</h3>
          <p className="text-slate-500">İlk məhsulu əlavə etmək üçün satıcı olun!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product: Product) => (
              <ProductCard 
                key={product.id}
                product={product}
                onSelect={(p: Product) => onProductSelect?.(p)}
                hoveredProduct={hoveredProduct}
                setHoveredProduct={setHoveredProduct}
                handleTouchStart={handleTouchStart}
                handleTouchEnd={handleTouchEnd}
                onAddToCart={onAddToCart}
                onSellerClick={onSellerClick}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
