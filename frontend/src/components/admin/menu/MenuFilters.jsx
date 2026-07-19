const DEFAULT_CATEGORIES = ["All", "Breakfast", "Starters", "Main Course", "Desserts", "Beverages"];

const DIET_OPTIONS = [
  { label: "ALL",     value: "all",     icon: null  },
  { label: "VEG",     value: "veg",     icon: "●"   },
  { label: "NON-VEG", value: "non-veg", icon: "▲"   },
  { label: "VEGAN",   value: "vegan",   icon: "🌿"  },
  { label: "DIETARY", value: "dietary", icon: "🥗"  },
];

const PRICE_OPTIONS = ["All Prices", "Under ₹100", "₹100 – ₹200", "₹200 – ₹500", "Above ₹500"];

export default function MenuFilters({
  search          = "",
  onSearchChange,
  priceFilter     = "All Prices",
  onPriceChange,
  dietFilter      = "all",
  onDietChange,
  activeCategory  = "All",
  onCategoryChange,
  totalCount      = 0,
}) {
  const activePillClass =
    "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black border-yellow-500 font-extrabold";
  const inactivePillClass =
    "bg-transparent text-neutral-500 border-neutral-800 font-bold hover:border-neutral-600 hover:text-neutral-300";

  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-2xl px-7 py-5 mb-7">

      {/* ── Row 1: Search · Price · Count ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[460px]">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none select-none">
            🔍
          </span>
          <input
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search for a dish..."
            className="w-full pl-10 pr-4 py-2.5 bg-black border border-neutral-800 rounded-xl text-neutral-300 text-sm placeholder-neutral-600 outline-none focus:border-yellow-500 transition-colors"
          />
        </div>

        {/* Price dropdown */}
        <div className="relative">
          <select
            value={priceFilter}
            onChange={(e) => onPriceChange?.(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 bg-black border border-neutral-800 rounded-xl text-neutral-300 text-sm cursor-pointer outline-none focus:border-yellow-500 transition-colors min-w-[140px]"
          >
            {PRICE_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 pointer-events-none">
            ▾
          </span>
        </div>

        {/* Count */}
        <span className="ml-auto text-xs font-bold tracking-widest uppercase text-neutral-500">
          {totalCount} DISHES FOUND
        </span>
      </div>

      {/* ── Row 2: Diet Pills ── */}
      <div className="flex flex-wrap gap-2 mb-3">
        {DIET_OPTIONS.map(({ label, value, icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => onDietChange?.(value)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs tracking-wide border transition-all cursor-pointer
              ${dietFilter === value ? activePillClass : inactivePillClass}`}
          >
            {icon && <span className="text-[11px]">{icon}</span>}
            {label}
          </button>
        ))}
      </div>

      {/* ── Row 3: Category Pills — always in fixed order ── */}
      <div className="flex flex-wrap gap-2">
        {DEFAULT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoryChange?.(cat)}
            className={`rounded-full px-4 py-1.5 text-xs tracking-wide border transition-all cursor-pointer
              ${activeCategory === cat ? activePillClass : inactivePillClass}`}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

    </div>
  );
}