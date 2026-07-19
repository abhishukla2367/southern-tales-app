import React, { useState, useEffect, useRef } from "react";
import Mission from "../components/Mission";
import ChefCard from "../components/ChefCard";

/* ================= CLOUDINARY IMAGES ================= */
const BASE = "https://res.cloudinary.com/db2vju4mv/image/upload";

const IMG = {
  about:      `${BASE}/f_auto,q_auto/v1772548008/our-story_gfmaxu.webp`,
  chefArjun:  `${BASE}/f_auto,q_auto/v1772547639/chef-arjun_vpsren.jpg`,
  chefPooja:  `${BASE}/f_auto,q_auto/v1772547640/chef-pooja_mkbtlg.jpg`,
  chefVikram: `${BASE}/f_auto,q_auto/v1772547640/chef-vikram_ktndzy.jpg`,
};

/* ================= COUNTER HOOK (same as Home.jsx) ================= */
function useCounter(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref     = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const t0   = performance.now();
          const tick = (now) => {
            const p    = Math.min((now - t0) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 4);
            setCount(Math.floor(ease * target));
            if (p < 1) requestAnimationFrame(tick);
            else setCount(target);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);
  return [count, ref];
}

/* ================= COUNTER STAT COMPONENT ================= */
const CounterStat = ({ target, suffix, label, icon }) => {
  const [count, ref] = useCounter(target);
  return (
    <div
      ref={ref}
      className="group relative text-center px-4 py-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-orange-500/30 transition-all duration-500"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-12 h-[2px] bg-orange-500 rounded-full transition-all duration-500" />
      <p className="text-4xl md:text-5xl font-black text-orange-500 mb-3 transition-transform duration-300 group-hover:scale-110">
        {count}{suffix}
      </p>
      <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-black leading-relaxed">
        {label}
      </p>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */
export default function About() {
  return (
    <main
      role="main"
      className="bg-black text-[#F3F4F6] overflow-hidden font-sans pt-28"
    >
      {/* 1. ARCHITECTURAL HERO */}
      <section className="relative min-h-[75vh] flex items-center justify-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[#000000]" />
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_bottom_left,_#b45309,_transparent_50%),radial-gradient(circle_at_top_right,_#111827,_transparent_50%)]" />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 30L15 0h30L30 30zM15 60L0 30h30L15 60zM45 60L30 30h30L45 60zM30 30L15 0h30L30 30z' fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 max-w-5xl text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-[1px] w-12 bg-orange-500"></div>
            <span className="text-xs uppercase tracking-[0.4em] text-orange-500 font-black">
              ESTABLISHED 2010
            </span>
            <div className="h-[1px] w-12 bg-orange-500"></div>
          </div>

          <h1 className="text-6xl md:text-9xl font-black text-white mb-8 leading-[0.85] tracking-tighter">
            Heritage <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-orange-500 to-yellow-600">
              Redefined.
            </span>
          </h1>

          <p className="text-lg md:text-2xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
            Southern Tales is a sanctuary where ancestral spice secrets meet the
            finesse of modern culinary artistry.
          </p>

          <div className="mt-12 animate-bounce">
            <div className="w-px h-20 bg-gradient-to-b from-orange-500 to-transparent mx-auto"></div>
          </div>
        </div>
      </section>

      {/* 2. THE PHILOSOPHY */}
      <section className="py-32 px-6 bg-black">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7 relative group">
            <div className="absolute -inset-4 border border-orange-500/20 rounded-[3rem] translate-x-4 translate-y-4 -z-10 transition-transform group-hover:translate-x-0 group-hover:translate-y-0" />
            <img
              src={IMG.about}
              alt="Culinary craftsmanship"
              className="rounded-[2.5rem] shadow-2xl w-full h-[550px] object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000"
            />
            <div className="absolute -bottom-10 -right-10 hidden xl:flex w-48 h-48 bg-[#111111] rounded-full items-center justify-center p-8 text-center border-8 border-black shadow-2xl">
              <p className="text-orange-500 text-xs font-black leading-tight uppercase tracking-widest">
                100% Organic Spices
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <h3 className="text-orange-500 font-black text-xs uppercase tracking-widest">
                Our Philosophy
              </h3>
              <h2 className="text-5xl md:text-6xl font-black text-white leading-tight tracking-tighter">
                Rooted in Tradition, <br />
                Refined for Today.
              </h2>
            </div>

            <div className="space-y-6 text-gray-400 text-lg leading-relaxed font-light">
              <p>
                Southern Tales was born from a deep respect for Southern Indian
                culinary traditions. We believe food isn't just sustenance—it's
                a vessel for memory and emotion.
              </p>
              <p className="border-l-2 border-orange-500 pl-6 italic font-medium text-gray-200 bg-white/5 py-4 rounded-r-xl">
                "Every recipe we serve carries generations of wisdom, carefully
                adapted to dance on the modern palate."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. NOIR STATS SECTION — animated counters */}
      <section className="bg-[#080808] border-y border-white/5 text-white py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-4 mb-16">
            <div className="h-[1px] w-16 bg-orange-500/40"></div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-orange-500/70 font-black">By the Numbers</span>
            <div className="h-[1px] w-16 bg-orange-500/40"></div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-8">
            <CounterStat target={15}  suffix="+" label="Years of Heritage" icon="⌛" />
            <CounterStat target={50}  suffix="+" label="Spice Blends"      icon="🌶" />
            <CounterStat target={10}  suffix="k+" label="Global Guests"    icon="🌍" />
            <CounterStat target={3}   suffix=""  label="Master Chefs"      icon="👨‍🍳" />
            <CounterStat target={120} suffix="+" label="Dedicated Staff"   icon="🤝" />
          </div>
        </div>
      </section>

      {/* 4. CHEF CURATION SECTION */}
      <section className="bg-black py-32 px-6">
        <div className="max-w-4xl mx-auto text-center mb-24">
          <span className="text-orange-500 font-black uppercase tracking-[0.3em] text-xs border border-orange-500/30 px-6 py-2 rounded-full">
            The Artisans
          </span>
          <h2 className="text-5xl md:text-7xl font-black mt-8 text-white tracking-tighter">
            The Minds Behind <br /> the Magic
          </h2>
        </div>

        <div className="max-w-7xl mx-auto grid gap-10 md:grid-cols-3">
          <ChefCard
            image={IMG.chefArjun}
            name="Arjun Mehta"
            role="Executive Visionary"
            colorTheme="orange"
            description="18 years of redefining the boundaries of Southern Coastal cuisine."
          />
          <ChefCard
            image={IMG.chefPooja}
            name="Pooja Nair"
            role="Pastry Alchemist"
            colorTheme="orange"
            description="Blending botanical extracts with traditional jaggery-based sweets."
          />
          <ChefCard
            image={IMG.chefVikram}
            name="Vikram Singh"
            role="Spice Master"
            colorTheme="orange"
            description="A specialist in the lost art of slow-fire regional tempering."
          />
        </div>
      </section>

      {/* 5. THE MISSION */}
      <div className="bg-[#080808] border-t border-white/5">
        <Mission />
      </div>
    </main>
  );
}