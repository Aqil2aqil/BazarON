import { ShoppingBag, Facebook, Instagram, Twitter, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 lg:col-span-1">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-neon-purple to-neon-blue rounded-lg flex items-center justify-center">
                <ShoppingBag className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-display font-bold">BazarON</span>
            </div>
            <p className="text-slate-400 mb-8 max-w-xs">
              Orijinal regional bazar təcrübəsini rəqəmsal dünyaya gətiririk. Yerli olanı dəstəkləyin, təzə qidalanın.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-neon-purple transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-neon-purple transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-neon-purple transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-8">Sürətli Keçidlər</h4>
            <ul className="space-y-4 text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">Ana Səhifə</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Bazarlar</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Kateqoriyalar</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Haqqımızda</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-8">Dəstək</h4>
            <ul className="space-y-4 text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">Yardım Mərkəzi</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Satıcı Ol</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Çatdırılma Məlumatı</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Bizimlə Əlaqə</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-8">Xəbər Bülleteni</h4>
            <p className="text-slate-400 mb-6">Mövsümi məhsullar və regional bazar tədbirləri haqqında yenilikləri əldə etmək üçün abunə olun.</p>
            <div className="relative">
              <input 
                type="email" 
                placeholder="E-poçtunuz" 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-neon-blue transition-colors"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-neon-blue rounded-lg hover:bg-neon-blue/80 transition-colors">
                <Mail className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-sm">
          <p>© 2026 BazarON. Bütün hüquqlar qorunur.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white">Məxfilik Siyasəti</a>
            <a href="#" className="hover:text-white">İstifadə Şərtləri</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
