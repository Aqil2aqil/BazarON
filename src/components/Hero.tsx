import { motion } from 'motion/react';
// 'motion/react' yerinə standar
import { Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative pt-24 pb-12 overflow-hidden bg-white"> {/* Boşluğu bir az azaltdıq */}
      {/* Background Accents */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-purple-500/10 to-transparent blur-3xl rounded-full" />
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      </div>

      {/* BURADA DƏYİŞİKLİK EDİLDİ: maxWidth indi 800px-dir */}
      <div className="mx-auto px-4 sm:px-6 text-center max-w-[800px]"> 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center"
        >
          {/* Üst Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-purple-600 text-[12px] font-bold mb-6 shadow-sm">
            <Sparkles className="w-4 h-4" />
            <span className="uppercase tracking-widest">Ənənəvi Bazar</span>
          </div>
          
          {/* Başlıq: Text ölçüsü artırıldı */}
          <h1 className="text-4xl md:text-6xl font-black leading-[1.1] mb-6 tracking-tight text-slate-900">
            Yerli Ticarətin <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 inline-block pb-2">
              Gələcəyi
            </span>
          </h1>
          
          {/* Açıqlama: Text ölçüsü artırıldı və genişliyi məhdudlaşdırıldı */}
          <p className="text-lg text-slate-600 leading-relaxed font-medium max-w-[600px]">
            Regionunuzun ən təzə məhsullarını kəşf edin və yerli biznesləri dəstəkləyin. 
            Biz orijinal bazar təcrübəsini barmaqlarınızın ucuna gətiririk.
          </p>
        </motion.div>
      </div>
    </section>
  );
}