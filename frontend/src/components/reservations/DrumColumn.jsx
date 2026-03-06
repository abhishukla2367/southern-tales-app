import { useRef, useEffect, useCallback } from "react";

const ITEM_H    = 36;  // ✅ reduced from 48
const VISIBLE   = 3;   // ✅ reduced from 5
const PAD_COUNT = Math.floor(VISIBLE / 2);

export default function DrumColumn({ items, selected, onSelect, label }) {
  const listRef     = useRef(null);
  const scrollTimer = useRef(null);

  const scrollToIndex = useCallback((idx, behavior = "smooth") => {
    listRef.current?.scrollTo({ top: idx * ITEM_H, behavior });
  }, []);

  useEffect(() => {
    const idx = items.indexOf(selected);
    if (idx !== -1) scrollToIndex(idx, "instant");
  }, [selected, items, scrollToIndex]);

  const handleScroll = () => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      if (!listRef.current) return;
      const snapped = Math.round(listRef.current.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(items.length - 1, snapped));
      scrollToIndex(clamped, "smooth");
      onSelect(items[clamped]);
    }, 120);
  };

  const containerH = ITEM_H * VISIBLE;
  const paddingV   = ITEM_H * PAD_COUNT;

  return (
    <div className="flex flex-col items-center" style={{ width: 72 }}>
      <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 mb-2">{label}</span>
      <div className="relative rounded-xl overflow-hidden" style={{ height: containerH, width: "100%" }}>
        {/* top fade */}
        <div className="absolute inset-x-0 top-0 z-10 pointer-events-none"
          style={{ height: paddingV, background: "linear-gradient(to bottom, #161616 0%, transparent 100%)" }} />
        {/* highlight */}
        <div className="absolute inset-x-0 z-10 pointer-events-none mx-1 rounded-lg"
          style={{ top: paddingV, height: ITEM_H, background: "rgba(245,194,122,0.07)", border: "1.5px solid rgba(245,194,122,0.25)" }} />
        {/* bottom fade */}
        <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
          style={{ height: paddingV, background: "linear-gradient(to top, #161616 0%, transparent 100%)" }} />
        <div ref={listRef} onScroll={handleScroll}
          className="absolute inset-0 overflow-y-scroll"
          style={{ scrollbarWidth: "none", paddingTop: paddingV, paddingBottom: paddingV }}>
          {items.map((item, i) => {
            const isSel = item === selected;
            return (
              <div key={item}
                onClick={() => { onSelect(item); scrollToIndex(i, "smooth"); }}
                className="flex items-center justify-center cursor-pointer"
                style={{ height: ITEM_H }}>
                <span className="font-mono font-black transition-all duration-200 select-none"
                  style={{ fontSize: isSel ? 20 : 13, color: isSel ? "#f5c27a" : "#3f3f46" }}>
                  {String(item).padStart(2, "0")}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}