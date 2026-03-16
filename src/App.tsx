import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductList from './components/ProductList';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import Profile from './components/Profile';
import MobileNav from './components/MobileNav';
import Cart from './components/Cart';
import Toast from './components/Toast';
import SellerProfile from './components/SellerProfile';
import ProductDetail from './components/ProductDetail';
import { db, auth } from './lib/firebase';
import { ref, get } from 'firebase/database';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'profile' | 'seller'>('home');
  const [currentSellerId, setCurrentSellerId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Hamısı');
  const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({
    message: '',
    isVisible: false
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (message: string) => {
    setToast({ message, isVisible: true });
  };

  const handleProductSelect = async (productId: string) => {
    try {
      const productRef = ref(db, `products/${productId}`);
      const snapshot = await get(productRef);
      const productData = snapshot.val();
      if (productData) {
        setSelectedProduct({ id: productId, ...productData });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <Header 
        onOpenAuth={() => setIsAuthModalOpen(true)} 
        onNavigate={(page) => setCurrentPage(page)}
        onSearch={(term) => setSearchTerm(term)}
        onOpenCart={() => setIsCartOpen(true)}
      />
      
      <main>
        {currentPage === 'home' ? (
          <>
            <Hero />
            <ProductList 
              searchTerm={searchTerm} 
              initialCategory={selectedCategory} 
              onAddToCart={() => showToast('Məhsul səbətə uğurla əlavə edildi! ✅')}
              onSellerClick={(sellerId) => {
                setCurrentSellerId(sellerId);
                setCurrentPage('seller');
              }}
              onProductSelect={(p) => setSelectedProduct(p)}
            />
            <HowItWorks />
          </>
        ) : currentPage === 'profile' ? (
          <Profile onBack={() => setCurrentPage('home')} />
        ) : (
          currentSellerId && (
            <SellerProfile 
              sellerId={currentSellerId} 
              onBack={() => setCurrentPage('home')} 
              onAddToCart={() => showToast('Məhsul səbətə uğurla əlavə edildi! ✅')}
              onProductSelect={(p) => setSelectedProduct(p)}
            />
          )
        )}
      </main>
      
      <Footer />

      <MobileNav 
        currentPage={currentPage} 
        onNavigate={(page) => {
          if (page === 'profile' && !user) {
            setIsAuthModalOpen(true);
          } else {
            setCurrentPage(page);
          }
        }} 
        onOpenCart={() => setIsCartOpen(true)}
      />
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      <Cart 
        isOpen={isCartOpen}
        onOpen={() => setIsCartOpen(true)}
        onClose={() => setIsCartOpen(false)}
        onOrderComplete={() => showToast('Sifarişiniz uğurla tamamlandı! 🛍️')} 
        onProductClick={handleProductSelect}
      />

      <AnimatePresence>
        {selectedProduct && (
          <ProductDetail 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
            onAddToCart={() => showToast('Məhsul səbətə uğurla əlavə edildi! ✅')}
            onSellerClick={(sellerId) => {
              setCurrentSellerId(sellerId);
              setCurrentPage('seller');
              setSelectedProduct(null);
            }}
          />
        )}
      </AnimatePresence>

      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />
    </div>
  );
}
