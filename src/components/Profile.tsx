import React, { useState, useEffect, ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  LogOut, 
  Save, 
  ChevronLeft,
  ShoppingBag,
  Heart,
  Package,
  Star,
  Loader2,
  Plus,
  Upload,
  Image as ImageIcon,
  Video,
  Trash2,
  CheckCircle,
  Settings,
  List
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut, updateProfile, User as FirebaseUser } from 'firebase/auth';
import { ref as dbRef, onValue, update, push, set as dbSet, serverTimestamp } from 'firebase/database';
import MyProducts from './MyProducts';
import { CATEGORIES } from '../constants';

interface ProductMedia {
  images: string[];
  video?: string;
}

interface Product {
  id?: string;
  sellerId: string;
  sellerName: string;
  sellerRegion?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  media: ProductMedia;
  createdAt: any;
}

interface UserData {
  fullName: string;
  email: string;
  phone?: string;
  region?: string;
  role?: 'buyer' | 'seller';
  photoURL?: string;
}

interface ProfileProps {
  onBack: () => void;
}

export default function Profile({ onBack }: ProfileProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'add_product' | 'my_products'>('info');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [myProductCount, setMyProductCount] = useState(0);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: CATEGORIES[0],
    stock: '',
    discount: ''
  });

  const [productMedia, setProductMedia] = useState<{
    images: File[];
    video: File | null;
  }>({
    images: [],
    video: null
  });

  const [form, setForm] = useState({
    phone: '',
    region: ''
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = dbRef(db, `users/${currentUser.uid}`);
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setUserData(data);
            setForm({
              phone: data.phone || '',
              region: data.region || ''
            });
          }
          setLoading(false);
        });

        // Get product count
        const productsRef = dbRef(db, 'products');
        onValue(productsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const count = Object.values(data).filter((p: any) => p.sellerId === currentUser.uid).length;
            setMyProductCount(count);
          } else {
            setMyProductCount(0);
          }
        });
      } else {
        setLoading(false);
        onBack(); // Redirect if not logged in
      }
    });

    return () => unsubscribe();
  }, [onBack]);

  const handleLogout = async () => {
    await signOut(auth);
    onBack();
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await update(dbRef(db, `users/${user.uid}`), {
        phone: form.phone,
        region: form.region
      });
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleBecomeSeller = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await update(dbRef(db, `users/${user.uid}`), {
        role: 'seller'
      });
      setUserData(prev => prev ? { ...prev, role: 'seller' } : null);
    } catch (error) {
      console.error("Error becoming seller:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) return;
    setProductLoading(true);
    setUploadProgress(0);

    try {
      // Final size check for all media combined
      let totalSize = productMedia.images.reduce((acc, img) => acc + img.size, 0);
      if (productMedia.video) totalSize += productMedia.video.size;

      // Base64 overhead is ~33%, RTDB limit is 10MB
      if (totalSize > 7.5 * 1024 * 1024) {
        alert('Məhsulun ümumi media həcmi çox böyükdür (Max 7.5MB). Zəhmət olmasa daha kiçik fayllar seçin.');
        setProductLoading(false);
        return;
      }

      const imageUrls: string[] = [];
      let videoUrl = '';

      // Convert Images to Base64
      for (let i = 0; i < productMedia.images.length; i++) {
        const file = productMedia.images[i];
        const base64 = await fileToBase64(file);
        imageUrls.push(base64);
        setUploadProgress(((i + 1) / (productMedia.images.length + (productMedia.video ? 1 : 0))) * 100);
      }

      // Convert Video to Base64
      if (productMedia.video) {
        videoUrl = await fileToBase64(productMedia.video);
        setUploadProgress(100);
      }

      const productRef = push(dbRef(db, 'products'));
      
      const newProduct: any = {
        sellerId: user.uid,
        name: productForm.name || "Adsız Məhsul",
        description: productForm.description || "",
        price: parseFloat(productForm.price) || 0,
        category: productForm.category || "Digər",
        stock: parseInt(productForm.stock) || 0,
        discount: parseInt(productForm.discount) || 0,
        sales: 0,
        media: {
          images: imageUrls
        },
        createdAt: serverTimestamp()
      };

      if (videoUrl) {
        newProduct.media.video = videoUrl;
      }

      await dbSet(productRef, newProduct);
      
      // Reset form
      setProductForm({
        name: '',
        description: '',
        price: '',
        category: 'Meyvə və Tərəvəz',
        stock: '',
        discount: ''
      });
      setProductMedia({ images: [], video: null });
      setShowProductForm(false);
    } catch (error) {
      console.error("Error uploading product:", error);
    } finally {
      setProductLoading(false);
      setUploadProgress(0);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const photoURL = await fileToBase64(file);
      
      await updateProfile(user, { photoURL });
      await update(dbRef(db, `users/${user.uid}`), { photoURL });
      
      setUserData(prev => prev ? { ...prev, photoURL } : null);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 text-neon-purple animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-neon-purple transition-colors mb-8 group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Geri qayıt</span>
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Basic Info */}
          <div className="lg:col-span-1 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-8 rounded-[2.5rem] text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-neon-purple to-neon-blue opacity-10" />
              
              <div className="relative inline-block mb-6">
                <div className="w-32 h-32 rounded-full border-4 border-neon-purple p-1 neon-glow-purple overflow-hidden bg-white">
                  {userData?.photoURL || user?.photoURL ? (
                    <img 
                      src={userData?.photoURL || user?.photoURL || ''} 
                      alt="Profile" 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                      <User className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
                  <Camera className="w-5 h-5 text-neon-purple" />
                  <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                </label>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-full">
                    <Loader2 className="w-8 h-8 text-neon-purple animate-spin" />
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-display font-bold mb-1">{userData?.fullName || user?.displayName}</h2>
              <p className="text-slate-500 text-sm mb-6">{userData?.email || user?.email}</p>
              
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-purple/10 text-neon-purple text-xs font-bold uppercase tracking-wider">
                {userData?.role === 'seller' ? 'Satıcı' : 'Alıcı'}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass p-6 rounded-[2rem] space-y-2"
            >
              <button 
                onClick={() => setActiveTab('info')} 
                className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${activeTab === 'info' ? 'bg-neon-purple text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <User className="w-5 h-5" />
                Şəxsi Məlumatlar
              </button>
              
              {userData?.role === 'seller' ? (
                <>
                  <button 
                    onClick={() => setActiveTab('add_product')} 
                    className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${activeTab === 'add_product' ? 'bg-neon-purple text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <Plus className="w-5 h-5" />
                    Məhsul Əlavə Et
                  </button>
                  <button 
                    onClick={() => setActiveTab('my_products')} 
                    className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${activeTab === 'my_products' ? 'bg-neon-purple text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <List className="w-5 h-5" />
                    Məhsullarımı İdarə Et
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setActiveTab('add_product')} 
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${activeTab === 'add_product' ? 'bg-neon-purple text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <ShoppingBag className="w-5 h-5" />
                  Satıcı Ol
                </button>
              )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass p-6 rounded-[2rem] space-y-4"
            >
              <h3 className="font-bold text-slate-900 mb-4">Statistika</h3>
              {userData?.role === 'seller' && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/50">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5 text-neon-purple" />
                    <span className="text-sm text-slate-600">Məhsullarım</span>
                  </div>
                  <span className="font-bold">{myProductCount}</span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/50">
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-rose-500" />
                  <span className="text-sm text-slate-600">Bəyəndiyim məhsullar</span>
                </div>
                <span className="font-bold">12</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/50">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-neon-blue" />
                  <span className="text-sm text-slate-600">Mənim sifarişlərim</span>
                </div>
                <span className="font-bold">4</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/50">
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-amber-500" />
                  <span className="text-sm text-slate-600">İzlədiyim bazarlar</span>
                </div>
                <span className="font-bold">6</span>
              </div>
            </motion.div>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-red-500/20 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all"
            >
              <LogOut className="w-5 h-5" />
              Çıxış et
            </button>
          </div>

          {/* Right Column: Details & Editing */}
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'info' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass p-8 rounded-[2.5rem]"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-display font-bold">Şəxsi Məlumatlar</h3>
                  {!editMode ? (
                    <button 
                      onClick={() => setEditMode(true)}
                      className="text-neon-purple font-bold hover:underline"
                    >
                      Düzəliş et
                    </button>
                  ) : (
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setEditMode(false)}
                        className="text-slate-400 font-bold hover:text-slate-600"
                      >
                        Ləğv et
                      </button>
                      <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 text-neon-purple font-bold hover:underline disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Yadda saxla
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ad Soyad</label>
                    <div className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl border border-slate-100">
                      <User className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-900 font-medium">{userData?.fullName || user?.displayName}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">E-poçt</label>
                    <div className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl border border-slate-100">
                      <Mail className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-900 font-medium">{userData?.email || user?.email}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Telefon</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="tel" 
                        disabled={!editMode}
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+994 -- --- -- --"
                        className={`w-full p-4 pl-12 bg-white/50 rounded-2xl border border-slate-100 outline-none transition-all ${editMode ? 'focus:border-neon-purple ring-2 ring-neon-purple/5' : 'cursor-default'}`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Region</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        disabled={!editMode}
                        value={form.region}
                        onChange={(e) => setForm({ ...form, region: e.target.value })}
                        placeholder="Məsələn: Gəncə, Lənkəran"
                        className={`w-full p-4 pl-12 bg-white/50 rounded-2xl border border-slate-100 outline-none transition-all ${editMode ? 'focus:border-neon-purple ring-2 ring-neon-purple/5' : 'cursor-default'}`}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'add_product' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass p-8 rounded-[2.5rem] bg-gradient-to-br from-neon-purple/5 to-neon-blue/5"
              >
                {userData?.role === 'seller' ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                        <Plus className="w-6 h-6 text-neon-purple" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Məhsul Əlavə Et</h4>
                        <p className="text-sm text-slate-500">Yeni məhsulunuzu bazara çıxarın.</p>
                      </div>
                    </div>
                    
                    {!showProductForm ? (
                      <button 
                        onClick={() => setShowProductForm(true)}
                        className="w-full px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Yeni Məhsul
                      </button>
                    ) : (
                      <form onSubmit={handleProductSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase">Məhsulun Adı</label>
                          <input 
                            type="text" 
                            required
                            value={productForm.name}
                            onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                            className="w-full p-3 bg-white rounded-xl border border-slate-100 outline-none focus:border-neon-purple"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase">Təsvir</label>
                          <textarea 
                            required
                            value={productForm.description}
                            onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                            className="w-full p-3 bg-white rounded-xl border border-slate-100 outline-none focus:border-neon-purple min-h-[100px]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Qiymət (₼)</label>
                            <input 
                              type="number" 
                              required
                              value={productForm.price}
                              onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                              className="w-full p-3 bg-white rounded-xl border border-slate-100 outline-none focus:border-neon-purple"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Endirim (%)</label>
                            <input 
                              type="number" 
                              value={productForm.discount}
                              onChange={(e) => setProductForm({...productForm, discount: e.target.value})}
                              placeholder="0"
                              className="w-full p-3 bg-white rounded-xl border border-slate-100 outline-none focus:border-neon-purple"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Stok (Ədəd/Kq)</label>
                            <input 
                              type="number" 
                              required
                              value={productForm.stock}
                              onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                              className="w-full p-3 bg-white rounded-xl border border-slate-100 outline-none focus:border-neon-purple"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Kateqoriya</label>
                            <select 
                              value={productForm.category}
                              onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                              className="w-full p-3 bg-white rounded-xl border border-slate-100 outline-none focus:border-neon-purple"
                            >
                              {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Şəkillər (Max 5)</label>
                            <div className="flex flex-wrap gap-2">
                              {productMedia.images.map((img, idx) => (
                                <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                                  <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" />
                                  <button 
                                    type="button"
                                    onClick={() => setProductMedia({...productMedia, images: productMedia.images.filter((_, i) => i !== idx)})}
                                    className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl-lg"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              {productMedia.images.length < 5 && (
                                <label className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-neon-purple transition-colors">
                                  <ImageIcon className="w-6 h-6 text-slate-300" />
                                  <input 
                                    type="file" 
                                    multiple 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                      const files = Array.from(e.target.files || []);
                                      const validFiles = files.filter((file: File) => {
                                        if (file.size > 2 * 1024 * 1024) {
                                          alert(`${file.name} çox böyükdür. Şəkil maksimum 2MB ola bilər.`);
                                          return false;
                                        }
                                        return true;
                                      });
                                      setProductMedia({...productMedia, images: [...productMedia.images, ...validFiles].slice(0, 5)});
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Video (Könüllü)</label>
                            {productMedia.video ? (
                              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                                <div className="flex items-center gap-2">
                                  <Video className="w-5 h-5 text-neon-blue" />
                                  <span className="text-sm truncate max-w-[150px]">{productMedia.video.name}</span>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => setProductMedia({...productMedia, video: null})}
                                  className="text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <label className="flex items-center gap-2 p-3 bg-white rounded-xl border-2 border-dashed border-slate-200 cursor-pointer hover:border-neon-blue transition-colors">
                                <Video className="w-5 h-5 text-slate-300" />
                                <span className="text-sm text-slate-400">Video yüklə</span>
                                <input 
                                  type="file" 
                                  accept="video/*" 
                                  className="hidden" 
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file && file.size > 7 * 1024 * 1024) {
                                      alert('Video faylı çox böyükdür. Maksimum 7MB yükləyə bilərsiniz.');
                                      e.target.value = '';
                                      return;
                                    }
                                    setProductMedia({...productMedia, video: file || null});
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        {productLoading && (
                          <div className="space-y-2">
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-neon-purple"
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-center text-slate-400 uppercase font-bold">Yüklənir: {Math.round(uploadProgress)}%</p>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <button 
                            type="button"
                            onClick={() => setShowProductForm(false)}
                            className="flex-1 py-3 border-2 border-slate-100 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition-all"
                          >
                            Ləğv et
                          </button>
                          <button 
                            type="submit"
                            disabled={productLoading}
                            className="flex-2 py-3 bg-neon-purple text-white rounded-xl font-bold hover:bg-neon-purple/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {productLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                            Təsdiqlə
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center shadow-xl mx-auto mb-6 neon-glow-purple">
                      <ShoppingBag className="w-10 h-10 text-neon-purple" />
                    </div>
                    <h3 className="text-3xl font-display font-bold text-slate-900 mb-4">Satıcı olmaq istəyirsiniz?</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-8">
                      BazarON platformasında öz mağazanızı açın, məhsullarınızı bütün Azərbaycana tanıdın və yerli ticarətin gələcəyini bizimlə birlikdə qurun.
                    </p>
                    <div className="grid sm:grid-cols-3 gap-4 mb-8 text-left">
                      <div className="p-4 bg-white rounded-2xl border border-slate-100">
                        <div className="text-neon-purple font-bold mb-1">Geniş Auditoriya</div>
                        <div className="text-xs text-slate-400">Minlərlə alıcıya birbaşa çıxış əldə edin.</div>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-slate-100">
                        <div className="text-neon-blue font-bold mb-1">Asan İdarəetmə</div>
                        <div className="text-xs text-slate-400">Məhsullarınızı rahatlıqla əlavə edin və silin.</div>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-slate-100">
                        <div className="text-emerald-500 font-bold mb-1">Güvənli Ödəniş</div>
                        <div className="text-xs text-slate-400">Satışlarınızdan gələn qazancı təhlükəsiz alın.</div>
                      </div>
                    </div>
                    <button 
                      onClick={handleBecomeSeller}
                      disabled={saving}
                      className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-3 mx-auto shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle className="w-6 h-6" />}
                      İndi Satıcı Ol
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'my_products' && userData?.role === 'seller' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <MyProducts />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
