import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit2, Trash2, Loader2, X, CheckCircle, Image as ImageIcon, Video } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { ref, onValue, query, orderByChild, equalTo, remove, update } from 'firebase/database';

interface ProductMedia {
  images: string[];
  video?: string;
}

interface Product {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  media: ProductMedia;
  stock?: number;
  sales?: number;
  discount?: number;
}

export default function MyProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const productsRef = ref(db, 'products');
    const userProductsQuery = query(productsRef, orderByChild('sellerId'), equalTo(user.uid));

    const unsubscribe = onValue(userProductsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productsList = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          ...val
        }));
        setProducts(productsList);
      } else {
        setProducts([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setDeletingId(productToDelete.id);
    try {
      await remove(ref(db, `products/${productToDelete.id}`));
      setProductToDelete(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Məhsulu silərkən xəta baş verdi.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSaving(true);
    try {
      await update(ref(db, `products/${editingProduct.id}`), {
        name: editingProduct.name,
        description: editingProduct.description,
        price: Number(editingProduct.price),
        category: editingProduct.category,
        stock: Number(editingProduct.stock || 0),
        discount: Number(editingProduct.discount || 0)
      });
      setEditingProduct(null);
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Məhsulu yeniləyərkən xəta baş verdi.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-neon-purple animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-display font-bold text-slate-900">Mənim Məhsullarım</h3>
        <span className="px-3 py-1 bg-neon-purple/10 text-neon-purple rounded-full text-sm font-bold">
          {products.length} Məhsul
        </span>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 glass rounded-[2rem]">
          <p className="text-slate-500">Hələ heç bir məhsul əlavə etməmisiniz.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {products.map((product) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-4 rounded-[1.5rem] flex flex-col gap-4 group"
            >
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                  <img src={product.media?.images?.[0]} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 truncate">{product.name}</h4>
                  <p className="text-sm text-slate-500 truncate mb-2">{product.category}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-neon-purple">{product.price} ₼</span>
                    {product.discount ? (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">-{product.discount}%</span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Stok: <strong className="text-slate-700">{product.stock || 0}</strong></span>
                    <span>Satış: <strong className="text-slate-700">{product.sales || 0}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setEditingProduct(product)}
                  className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Düzəliş et
                </button>
                <button 
                  onClick={() => setProductToDelete(product)}
                  disabled={deletingId === product.id}
                  className="flex-1 py-2 bg-red-50 text-red-500 rounded-lg font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deletingId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Sil
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {productToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProductToDelete(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-[2rem] shadow-2xl z-[101] overflow-hidden p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Məhsulu Sil</h3>
              <p className="text-slate-500 mb-6">
                <strong className="text-slate-700">{productToDelete.name}</strong> adlı məhsulu silmək istədiyinizdən əminsiniz? Bu əməliyyat geri qaytarıla bilməz.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 py-3 border-2 border-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Ləğv et
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={deletingId === productToDelete.id}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deletingId === productToDelete.id ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sil'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingProduct(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[2rem] shadow-2xl z-[101] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Məhsula Düzəliş Et</h3>
                <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Məhsulun Adı</label>
                  <input 
                    type="text" 
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-neon-purple focus:bg-white transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Təsvir</label>
                  <textarea 
                    required
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-neon-purple focus:bg-white transition-colors min-h-[100px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Qiymət (₼)</label>
                    <input 
                      type="number" 
                      required
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                      className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-neon-purple focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Endirim (%)</label>
                    <input 
                      type="number" 
                      value={editingProduct.discount || ''}
                      onChange={(e) => setEditingProduct({...editingProduct, discount: Number(e.target.value)})}
                      className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-neon-purple focus:bg-white transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Stok</label>
                    <input 
                      type="number" 
                      required
                      value={editingProduct.stock || ''}
                      onChange={(e) => setEditingProduct({...editingProduct, stock: Number(e.target.value)})}
                      className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-neon-purple focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Kateqoriya</label>
                    <select 
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                      className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-neon-purple focus:bg-white transition-colors"
                    >
                      <option>Meyvə və Tərəvəz</option>
                      <option>Ət və Quş Əti</option>
                      <option>Taxıl və Ədviyyat</option>
                      <option>Əl İşləri</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="flex-1 py-3 border-2 border-slate-100 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition-all"
                  >
                    Ləğv et
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="flex-2 py-3 bg-neon-purple text-white rounded-xl font-bold hover:bg-neon-purple/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                    Yadda saxla
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
