import { motion } from 'motion/react';
import { ShieldCheck, Zap, Globe, Heart } from 'lucide-react';

const solutions = [
  {
    title: "24/7 Əlçatanlıq",
    desc: "Regional bazarlara istənilən vaxt, istənilən yerdə daxil olun. Artıq bazar günlərini gözləməyə ehtiyac yoxdur.",
    icon: Zap,
    color: "text-neon-blue"
  },
  {
    title: "Şəffaflıq və Etibar",
    desc: "Satıcılarla birbaşa ünsiyyət və məhsulun mənşəyinin yoxlanılması.",
    icon: ShieldCheck,
    color: "text-neon-purple"
  },
  {
    title: "Regional Dəstək",
    desc: "Hər bir alış Azərbaycanın yerli fermerlərini və sənətkarlarını birbaşa dəstəkləyir.",
    icon: Heart,
    color: "text-neon-pink"
  },
  {
    title: "Onlayn Baxış, Yerli Alış",
    desc: "Məhsullara onlayn baxın və üstünlük verdiyiniz çatdırılma və ya götürmə üsulunu seçin.",
    icon: Globe,
    color: "text-neon-cyan"
  }
];

export default function HowItWorks() {
  return (
    <section className="py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl lg:text-5xl font-display font-bold mb-6">Ənənənin Rəqəmsallaşdırılması</h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            Biz regional bazarlar ilə müasir rəqəmsal rahatlıq arasındakı boşluğu doldurur, yerli ticarət üçün davamlı ekosistem yaradırıq.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {solutions.map((sol, i) => (
              <motion.div
                key={sol.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass p-8 rounded-[2rem] hover:bg-white transition-colors"
              >
                <sol.icon className={`w-10 h-10 ${sol.color} mb-6`} />
                <h3 className="text-xl font-bold mb-3">{sol.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{sol.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="glass p-4 rounded-[3rem] relative z-10">
              <img 
                src="https://picsum.photos/seed/market/800/800" 
                alt="Local Bazaar" 
                className="rounded-[2.5rem] w-full aspect-square object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-6 -right-6 glass p-8 rounded-3xl max-w-xs neon-glow-blue">
                <p className="text-slate-900 font-medium italic">
                  "BazarON restoranım üçün təzə məhsullar əldə etmək üsulumu tamamilə dəyişdi. Keyfiyyət mükəmməldir."
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neon-blue/20" />
                  <div>
                    <div className="font-bold text-sm">Anar Məmmədov</div>
                    <div className="text-xs text-slate-500">Yerli Aşpaz</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-neon-blue/10 blur-[100px] -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
