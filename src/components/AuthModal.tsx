import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Chrome, Loader2 } from 'lucide-react';
import React, { useState, ChangeEvent, FormEvent, ReactNode } from 'react';
import { auth, db, googleProvider } from '../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { ref, set, serverTimestamp } from 'firebase/database';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | ReactNode | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const saveUserToDb = async (uid: string, email: string, fullName: string) => {
    await set(ref(db, `users/${uid}`), {
      fullName,
      email,
      createdAt: serverTimestamp(),
      role: 'user'
    });
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCredential.user, { displayName: formData.fullName });
        try {
          await saveUserToDb(userCredential.user.uid, formData.email, formData.fullName);
        } catch (dbErr: any) {
          console.error("Database Error:", dbErr);
          if (dbErr.message.includes('PERMISSION_DENIED')) {
            setError('Məlumat bazasına giriş icazəsi yoxdur. Zəhmət olmasa Firebase Rules tənzimləmələrini yoxlayın.');
          } else {
            setError('Profil məlumatları yadda saxlanılarkən xəta baş verdi.');
          }
          return;
        }
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }
      onClose();
    } catch (err: any) {
      console.error("Auth Error Full Object:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError(
          <div className="flex flex-col gap-2">
            <span>Bu email ünvanı artıq istifadə olunur.</span>
            <button 
              onClick={() => {
                setActiveTab('login');
                setError(null);
              }}
              className="text-neon-blue hover:underline text-left font-bold"
            >
              Daxil olmaq üçün bura klikləyin.
            </button>
          </div>
        );
      } else if (err.code === 'auth/unauthorized-domain') {
        setError(
          <div className="flex flex-col gap-2">
            <span>Bu domen Firebase-də icazə verilmiş domenlər siyahısında deyil.</span>
            <div className="bg-black/20 p-2 rounded text-xs font-mono break-all">
              {window.location.hostname}
            </div>
            <p className="text-xs">Zəhmət olmasa bu domeni Firebase Console-da "Authorized domains" siyahısına əlavə edin.</p>
          </div>
        );
      } else if (err.code === 'auth/invalid-credential') {
        setError('Email və ya şifrə yanlışdır.');
      } else if (err.code === 'auth/weak-password') {
        setError('Şifrə çox zəifdir (ən azı 6 simvol).');
      } else if (err.code === 'auth/internal-error') {
        setError('Daxili xəta baş verdi. Zəhmət olmasa internet bağlantınızı və Firebase tənzimləmələrini yoxlayın.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Giriş pəncərəsi bağlandı.');
      } else {
        setError(`Xəta baş verdi: ${err.message || 'Yenidən cəhd edin.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await saveUserToDb(user.uid, user.email || '', user.displayName || 'Adsız İstifadəçi');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Google ilə giriş zamanı xəta baş verdi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md glass rounded-[2.5rem] p-8 shadow-2xl border-2 border-neon-purple/30 overflow-hidden"
          >
            {/* Background Glows */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-neon-purple/20 blur-[80px] rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-neon-blue/20 blur-[80px] rounded-full" />

            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-slate-100/10 rounded-full transition-colors z-10"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>

            <div className="relative z-10">
              <div className="flex gap-4 mb-8 p-1 bg-slate-100/10 rounded-2xl">
                <button
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === 'login' 
                      ? 'bg-white text-slate-900 shadow-lg' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Daxil ol
                </button>
                <button
                  onClick={() => setActiveTab('signup')}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === 'signup' 
                      ? 'bg-white text-slate-900 shadow-lg' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Qeydiyyat
                </button>
              </div>

              <h2 className="text-3xl font-display font-bold mb-2">
                {activeTab === 'login' ? 'Xoş gəlmisiniz!' : 'Hesab yaradın'}
              </h2>
              <p className="text-slate-400 mb-6">
                {activeTab === 'login' 
                  ? 'Davam etmək üçün hesabınıza daxil olun.' 
                  : 'BazarON ailəsinə qoşulmaq üçün məlumatları doldurun.'}
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
                  {error}
                </div>
              )}

              <form className="space-y-4 mb-8" onSubmit={handleEmailAuth}>
                {activeTab === 'signup' && (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Ad və Soyad"
                      className="w-full bg-slate-100/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-neon-purple transition-colors text-white"
                    />
                  </div>
                )}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email ünvanı"
                    className="w-full bg-slate-100/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-neon-purple transition-colors text-white"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Şifrə"
                    className="w-full bg-slate-100/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-neon-purple transition-colors text-white"
                  />
                </div>
                <button 
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-neon-purple to-neon-blue text-white rounded-2xl font-bold shadow-lg hover:opacity-90 transition-opacity neon-glow-purple flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {activeTab === 'login' ? 'Daxil ol' : 'Qeydiyyatı tamamla'}
                </button>
              </form>

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-transparent px-2 text-slate-500">Və ya</span>
                </div>
              </div>

              <button 
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-4 glass border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white/10 transition-colors text-white disabled:opacity-50"
              >
                <Chrome className="w-5 h-5 text-neon-blue" />
                Google ilə daxil ol
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
