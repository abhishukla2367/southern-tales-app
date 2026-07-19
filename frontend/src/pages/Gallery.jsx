import { useState, useEffect, useCallback } from "react";

const BASE = "https://res.cloudinary.com/db2vju4mv/image/upload";

const CL = {
  // Food: Beverages
  filterCoffee:     `${BASE}/f_auto,q_auto/v1772552477/filter-coffee_jirsbm.jpg`,
  buttermilk:       `${BASE}/f_auto,q_auto/v1772552485/buttermilk_hdiu8w.jpg`,
  badamMilk:        `${BASE}/f_auto,q_auto/v1772552475/badam-milk_ibwfmp.jpg`,
  // Food: Desserts
  mysorePak:        `${BASE}/f_auto,q_auto/v1772552446/mysore-pak_ybzumq.webp`,
  gulabJamun:       `${BASE}/f_auto,q_auto/v1772552445/gulab-jamun_k3w0bg.webp`,
  badamHalwa:       `${BASE}/f_auto,q_auto/v1772552444/badam-halwa_rvz158.jpg`,
  // Food: Mains
  biryani:          `${BASE}/f_auto,q_auto/v1772552408/biryani_z3o9wa.jpg`,
  rasam:            `${BASE}/f_auto,q_auto/v1772552408/rasam_xrud1c.jpg`,
  chettinadChicken: `${BASE}/f_auto,q_auto/v1772552408/chettinad-chicken_eosq6b.jpg`,
  // Food: Starters
  chicken65:        `${BASE}/f_auto,q_auto/v1772552356/chicken-65_aselin.jpg`,
  cornCutlet:       `${BASE}/f_auto,q_auto/v1772552349/corn-cutlet_y59sgr.jpg`,
  paneerTikka:      `${BASE}/f_auto,q_auto/v1772552349/paneer-tikka_tvjcn1.jpg`,
  // Food: Breakfast
  pongal:           `${BASE}/f_auto,q_auto/v1772552278/pongal_ugvjil.jpg`,
  idli:             `${BASE}/f_auto,q_auto/v1772552277/idli_mgyai6.jpg`,
  appam:            `${BASE}/f_auto,q_auto/v1772552275/appam_xhodf7.webp`,
  // Interior
  interior1:  `${BASE}/f_auto,q_auto/v1772552560/interior1_h8lndv.gif`,
  interior2:  `${BASE}/f_auto,q_auto/v1772552548/interior2_uztwzg.jpg`,
  interior3:  `${BASE}/f_auto,q_auto/v1772552549/interior3_rnz0jd.jpg`,
  interior4:  `${BASE}/f_auto,q_auto/v1772552550/interior4_bpllqm.jpg`,
  interior5:  `${BASE}/f_auto,q_auto/v1772552551/interior5_z2spxo.jpg`,
  interior6:  `${BASE}/f_auto,q_auto/v1772552552/interior6_lmrqce.jpg`,
  interior7:  `${BASE}/f_auto,q_auto/v1772552553/interior7_ewulhk.avif`,
  interior8:  `${BASE}/f_auto,q_auto/v1772552554/interior8_vdy2iw.jpg`,
  interior9:  `${BASE}/f_auto,q_auto/v1772552555/interior9_bfcxdl.jpg`,
  interior10: `${BASE}/f_auto,q_auto/v1772552557/interior10_y5hcxd.jpg`,
  interior11: `${BASE}/f_auto,q_auto/v1772552558/interior11_reba2y.jpg`,
  interior12: `${BASE}/f_auto,q_auto/v1772552559/interior12_whtmvs.jpg`,
  interior14: `${BASE}/f_auto,q_auto/v1772552561/interior14_dwgpni.jpg`,
  interior15: `${BASE}/f_auto,q_auto/v1772552563/interior15_uz9ekd.jpg`,
  interior16: `${BASE}/f_auto,q_auto/v1772554612/interior16_jbob7j.jpg`,
  // Events
  events1:  `${BASE}/f_auto,q_auto/v1772552610/events1_ygyjae.jpg`,
  events2:  `${BASE}/f_auto,q_auto/v1772552612/events2_pmsrdi.avif`,
  events3:  `${BASE}/f_auto,q_auto/v1772552613/events3_vqlgn4.jpg`,
  events4:  `${BASE}/f_auto,q_auto/v1772552614/events4_zx3v0b.jpg`,
  events5:  `${BASE}/f_auto,q_auto/v1772552616/events5_ykz35g.jpg`,
  events6:  `${BASE}/f_auto,q_auto/v1772552617/events6_puhjs0.jpg`,
  events7:  `${BASE}/f_auto,q_auto/v1772552619/events7_q1dccv.jpg`,
  events8:  `${BASE}/f_auto,q_auto/v1772552619/events8_vw68t2.avif`,
  events9:  `${BASE}/f_auto,q_auto/v1772552620/events9_ospagx.jpg`,
  events10: `${BASE}/f_auto,q_auto/v1772552622/events10_ih3cjd.jpg`,
  events11: `${BASE}/f_auto,q_auto/v1772554309/events11_opmnqn.jpg`,
  events12: `${BASE}/f_auto,q_auto/v1772554311/events12_mrf65l.jpg`,
};
  const IMAGES = [
  // Row 1
  { src: CL.pongal,           category: "food",     title: "Traditional Pongal",      cloudinary: true },
  { src: CL.interior15,       category: "interior", title: "Chef's Special Garnish",  cloudinary: true },
  { src: CL.events12,         category: "events",   title: "Birthday Celebration",   cloudinary: true }, // events12
  // Row 2
  { src: CL.idli,             category: "food",     title: "Idli Sambar",             cloudinary: true },
  { src: CL.interior14,       category: "interior", title: "Premium Dining Area",     cloudinary: true },
  { src: CL.events11,         category: "events",   title: "Corporate Stage Setup",   cloudinary: true }, // events11
  // Row 3
  { src: CL.appam,            category: "food",     title: "Appam",                   cloudinary: true },
  { src: CL.interior12,       category: "interior", title: "Classic Interior View",   cloudinary: true },
  { src: CL.events10,         category: "events",   title: "Grand Entry Floral Decor", cloudinary: true }, // events10
  // Row 4
  { src: CL.cornCutlet,       category: "food",     title: "Corn Cutlet",             cloudinary: true },
  { src: CL.interior16,       category: "interior", title: "Chef at Work",            cloudinary: true },
  { src: CL.events9,          category: "events",   title: "Wedding Reception Hall",  cloudinary: true }, // events9
  // Row 5
  { src: CL.paneerTikka,      category: "food",     title: "Paneer Tikka",            cloudinary: true },
  { src: CL.interior11,       category: "interior", title: "Luxury Wall Art",         cloudinary: true },
  { src: CL.events8,          category: "events",   title: "Traditional Mandap",      cloudinary: true }, // events8
  // Row 6
  { src: CL.chicken65,        category: "food",     title: "Chicken 65",              cloudinary: true },
  { src: CL.interior10,       category: "interior", title: "Booth Seating",           cloudinary: true },
  { src: CL.events7,          category: "events",   title: "Outdoor Dinner",          cloudinary: true }, // events7
  // Row 7
  { src: CL.biryani,          category: "food",     title: "Biryani",                 cloudinary: true },
  { src: CL.interior1,        category: "interior", title: "Indoor Setup", cloudinary: true },
  { src: CL.events6,          category: "events",   title: "Evening Buffet Spread",    cloudinary: true }, // events6
  // Row 8
  { src: CL.chettinadChicken, category: "food",     title: "Chettinad Chicken",       cloudinary: true },
  { src: CL.interior9,        category: "interior", title: "Ambient Lighting",        cloudinary: true },
  { src: CL.events5,          category: "events",   title: "Traditional Event", cloudinary: true }, // events5
  // Row 9
  { src: CL.rasam,            category: "food",     title: "Rasam",                   cloudinary: true },
  { src: CL.interior8,        category: "interior", title: "Elegant Table Setting",   cloudinary: true },
  { src: CL.events4,          category: "events",   title: "Festive Mood",  cloudinary: true }, // events4
  // Row 10
  { src: CL.mysorePak,        category: "food",     title: "Mysore Pak",              cloudinary: true },
  { src: CL.interior7,        category: "interior", title: "Lounge Seating",          cloudinary: true },
  { src: CL.events3,          category: "events",   title: "Cultural Night",          cloudinary: true }, // events3
  // Row 11
  { src: CL.gulabJamun,       category: "food",     title: "Gulab Jamun",             cloudinary: true },
  { src: CL.interior6,        category: "interior", title: "Bar Counter View",        cloudinary: true },
  { src: CL.events2,          category: "events",   title: "Garba Event",             cloudinary: true }, // events2
  // Row 12
  { src: CL.badamHalwa,       category: "food",     title: "Badam Halwa",             cloudinary: true },
  { src: CL.interior5,        category: "interior", title: "Decorative Archway",      cloudinary: true },
  { src: CL.events1,          category: "events",   title: "Rangoli Competition",     cloudinary: true }, // events1
  
  // Remaining items
  { src: CL.filterCoffee,     category: "food",     title: "Filter Coffee",           cloudinary: true },
  { src: CL.buttermilk,       category: "food",     title: "Buttermilk",              cloudinary: true },
  { src: CL.badamMilk,        category: "food",     title: "Badam Milk",              cloudinary: true },
  { src: CL.interior4,        category: "interior", title: "Cozy Dining Nook",        cloudinary: true },
  { src: CL.interior3,        category: "interior", title: "Traditional Decor",       cloudinary: true },
  { src: CL.interior2,        category: "interior", title: "Window-Side Table",       cloudinary: true },
];
const FILTERS = [
  { key: "all",      label: "All",      activeBg: "bg-orange-400", activeText: "text-stone-950" },
  { key: "food",     label: "Food",     activeBg: "bg-emerald-400", activeText: "text-stone-950" },
  { key: "interior", label: "Interior", activeBg: "bg-teal-400",   activeText: "text-stone-950" },
  { key: "events",   label: "Events",   activeBg: "bg-violet-400", activeText: "text-stone-950" },
];

const catText   = { all: "text-orange-400",  food: "text-emerald-400",  interior: "text-teal-400",           events: "text-violet-400"         };
const catDot    = { all: "bg-orange-400",    food: "bg-emerald-400",    interior: "bg-teal-400",             events: "bg-violet-400"           };
const catBorder = { all: "border-orange-400/40", food: "border-emerald-400/40", interior: "border-teal-400/40", events: "border-violet-400/40" };
const catRing   = { all: "ring-orange-400",  food: "ring-emerald-400",  interior: "ring-teal-400",           events: "ring-violet-400"         };

const buildSrc = (img, w, fit = "crop") =>
  img.cloudinary ? img.src : `${img.src}?auto=format&fit=${fit}&w=${w}&q=80`;

export default function Gallery() {
  const [active,    setActive]    = useState("all");
  const [displayed, setDisplayed] = useState("all");
  const [fading,    setFading]    = useState(false);
  const [shown,     setShown]     = useState({});
  const [lb,        setLb]        = useState(null);

  const filtered = displayed === "all" ? IMAGES : IMAGES.filter(i => i.category === displayed);
  const current  = lb ? lb.list[lb.index] : null;

  const switchCat = (key) => {
    if (key === active || fading) return;
    setFading(true);
    setShown({});
    setTimeout(() => { setDisplayed(key); setActive(key); setFading(false); }, 260);
  };

  useEffect(() => {
    setShown({});
    const timers = filtered.map((_, i) =>
      setTimeout(() => setShown(s => ({ ...s, [i]: true })), 40 + i * 20)
    );
    return () => timers.forEach(clearTimeout);
  }, [displayed]);

  const onKey = useCallback((e) => {
    if (!lb) return;
    if (e.key === "Escape")     setLb(null);
    if (e.key === "ArrowRight") setLb(l => ({ ...l, index: (l.index + 1) % l.list.length }));
    if (e.key === "ArrowLeft")  setLb(l => ({ ...l, index: (l.index - 1 + l.list.length) % l.list.length }));
  }, [lb]);

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  useEffect(() => {
    document.body.style.overflow = lb ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lb]);

  return (
    <section className="min-h-screen bg-stone-950 text-stone-100">
      <div className="flex flex-col items-center text-center px-6 pt-24 pb-14">
        <span className={`text-[10px] font-semibold tracking-[0.4em] uppercase mb-5 block transition-colors duration-500 ${catText[active]}`}>
          Visual Stories
        </span>
        <h1 className="font-serif text-6xl sm:text-7xl md:text-8xl font-bold leading-none tracking-tight mb-6">
          Our{" "}
          <em className={`not-italic transition-colors duration-500 ${catText[active]}`}>Gallery</em>
        </h1>
        <p className="text-sm text-stone-500 max-w-md leading-relaxed font-light">
          A curated window into our world — the dishes we craft, the spaces we design,
          and the moments we celebrate together.
        </p>
        <div className={`w-px h-12 mt-8 opacity-50 transition-colors duration-500 ${catDot[active]}`} />
      </div>

      <div className="flex justify-center px-4 pb-12">
        <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 rounded-full p-1">
          {FILTERS.map(({ key, label, activeBg, activeText }) => {
            const count = key === "all" ? IMAGES.length : IMAGES.filter(i => i.category === key).length;
            const isActive = active === key;
            return (
              <button
                key={key}
                onClick={() => switchCat(key)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-semibold uppercase tracking-widest transition-all duration-300 select-none ${isActive ? `${activeBg} ${activeText} shadow-lg` : "text-stone-500 hover:text-stone-300"}`}
              >
                {label}
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${isActive ? "bg-black/20" : "bg-stone-800 text-stone-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`grid grid-cols-3 gap-8 px-10 pb-24 transition-opacity duration-[260ms] ${fading ? "opacity-0" : "opacity-100"}`}>
        {filtered.map((img, i) => (
          <div
            key={`${img.src}-${i}`}
            onClick={() => setLb({ index: i, list: filtered })}
            className={`group relative overflow-hidden rounded-md cursor-pointer bg-stone-900 transition-all duration-500 aspect-[4/3] ${shown[i] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
          >
            <img
              src={buildSrc(img, 600)}
              alt={img.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <span className={`text-[9px] font-semibold tracking-[0.3em] uppercase mb-1.5 ${catText[img.category]}`}>
                {img.category}
              </span>
              <span className="font-serif text-base italic text-stone-100 leading-tight">{img.title}</span>
            </div>
            <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
            </div>
          </div>
        ))}
      </div>

      {lb && current && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/96 backdrop-blur-2xl flex items-center justify-center px-4 py-6"
          style={{ animation: "fadeIn 0.25s ease" }}
          onClick={() => setLb(null)}
        >
          <button
            onClick={() => setLb(null)}
            className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-stone-800/80 border border-stone-700 text-stone-300 hover:bg-red-600 hover:border-red-600 hover:text-white flex items-center justify-center transition-all duration-300 hover:rotate-90"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 text-stone-600 text-[10px] tracking-widest uppercase font-medium select-none">
            <span>← → Navigate</span>
            <span className="w-px h-3 bg-stone-700" />
            <span>Esc Close</span>
          </div>
          <div className="relative max-w-5xl w-full flex flex-col items-center gap-5" onClick={e => e.stopPropagation()}>
            <div className="relative w-full flex items-center justify-center">
              <button
                onClick={() => setLb(l => ({ ...l, index: (l.index - 1 + l.list.length) % l.list.length }))}
                className="absolute -left-4 sm:-left-14 w-11 h-11 rounded-full bg-stone-800/70 border border-stone-700 text-stone-300 hover:bg-orange-400 hover:border-orange-400 hover:text-stone-950 flex items-center justify-center transition-all duration-200 z-10 hover:scale-110"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <img
                key={lb.index}
                src={buildSrc(current, 1400, "contain")}
                alt={current.title}
                className="max-h-[66vh] max-w-full rounded-lg shadow-2xl object-contain"
                style={{ animation: "imgIn 0.3s ease" }}
              />
              <button
                onClick={() => setLb(l => ({ ...l, index: (l.index + 1) % l.list.length }))}
                className="absolute -right-4 sm:-right-14 w-11 h-11 rounded-full bg-stone-800/70 border border-stone-700 text-stone-300 hover:bg-orange-400 hover:border-orange-400 hover:text-stone-950 flex items-center justify-center transition-all duration-200 z-10 hover:scale-110"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <div className="flex items-center justify-between w-full px-1">
              <div className="flex items-center gap-3">
                <span className={`flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.25em] uppercase px-3 py-1.5 rounded-full border bg-stone-900/60 ${catText[current.category]} ${catBorder[current.category]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${catDot[current.category]}`} />
                  {current.category}
                </span>
                <span className="font-serif text-lg italic text-stone-200">{current.title}</span>
              </div>
              <span className="text-xs font-medium tracking-widest text-stone-600 tabular-nums">
                {String(lb.index + 1).padStart(2, "0")} / {String(lb.list.length).padStart(2, "0")}
              </span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto max-w-full pb-1" style={{ scrollbarWidth: "none" }}>
              {lb.list.map((img, i) => (
                <img
                  key={i}
                  src={buildSrc(img, 120)}
                  alt={img.title}
                  onClick={() => setLb(l => ({ ...l, index: i }))}
                  className={`w-12 h-9 object-cover rounded flex-shrink-0 cursor-pointer transition-all duration-200 ${i === lb.index ? `opacity-100 scale-110 ring-2 ${catRing[active]}` : "opacity-30 hover:opacity-60"}`}
                />
              ))}
            </div>
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
            @keyframes imgIn  { from { opacity:0; transform:scale(0.95) } to { opacity:1; transform:scale(1) } }
          `}</style>
        </div>
      )}
    </section>
  );
}