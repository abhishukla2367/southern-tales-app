import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import API from "../api/axiosConfig";
const BASE = "https://res.cloudinary.com/db2vju4mv/image/upload";

const heroImages = [
  `${BASE}/f_auto,q_auto,w_1920/v1772540974/south-food_ehaehk.jpg`,
  `${BASE}/f_auto,q_auto,w_1920/v1772540977/south-food2_tsrvco.jpg`,
  `${BASE}/f_auto,q_auto,w_1920/v1772540972/south-food3_qr4f4j.jpg`,
];

const heroAlts = [
  "Authentic South Indian cuisine spread",
  "Traditional South Indian dishes at Southern Tales",
  "South Indian food platter at Southern Tales restaurant",
];
const CATEGORIES  = ["All","Breakfast","Starters","Main Course","Desserts","Beverages"];

const PRICE_RANGES = [
  { label:"All Prices",  value:"All"      },
  { label:"Under ₹200", value:"Under200"  },
  { label:"₹200 – ₹400",value:"200to400" },
  { label:"Above ₹400", value:"Above400"  },
];

const DIET_FILTERS = [
  { label:"All",      value:"All"     },
  { label:"● Veg",    value:"Veg"     },
  { label:"▲ Non-Veg",value:"NonVeg"  },
  { label:"🌿 Vegan",  value:"Vegan"   },
  { label:"🥗 Dietary",value:"Dietary" },
];

const DIET_COLOURS = {
  All:     { active:"#f5c27a", text:"#000" },
  Veg:     { active:"#4ade80", text:"#000" },
  NonVeg:  { active:"#f87171", text:"#000" },
  Vegan:   { active:"#34d399", text:"#000" },
  Dietary: { active:"#38bdf8", text:"#000" },
};

/* ════════════════════ MAIN COMPONENT ════════════════════ */
export default function Menu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const { addToCart }  = useCart();

  const [menuItems,        setMenuItems]        = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm,       setSearchTerm]       = useState("");
  const [selectedDiet,     setSelectedDiet]     = useState("All");
  const [selectedPrice,    setSelectedPrice]    = useState("All");
  const [activeHero,       setActiveHero]       = useState(0);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await API.get("/menu");
        const normalized = res.data.map((item) => ({
          ...item,
          _id: item._id ? item._id.toString() : item.id,
        }));
        setMenuItems(normalized);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching menu:", err);
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveHero(p => (p + 1) % heroImages.length), 3200);
    return () => clearInterval(t);
  }, []);

  const handleAdd = (item) => {
    if (!isLoggedIn) {
      alert("Please login to start adding items to your cart");
      return navigate("/login");
    }
    addToCart(item);
  };

  const filteredItems = menuItems.filter(item => {
    const dbCat      = item.category?.toLowerCase().replace(" ", "-");
    const selectedCat = selectedCategory.toLowerCase().replace(" ", "-");
    const catOk  = selectedCategory === "All" || dbCat === selectedCat;
    const srchOk = item.name.toLowerCase().includes(searchTerm.toLowerCase());

    let dietOk = true;
    if (selectedDiet === "Veg")     dietOk = item.veg && !item.vegan;
    if (selectedDiet === "NonVeg")  dietOk = !item.veg;
    if (selectedDiet === "Vegan")   dietOk = item.vegan;
    if (selectedDiet === "Dietary") dietOk = item.dietary;

    const p = item.price;
    let priceOk = true;
    if (selectedPrice === "Under200")  priceOk = p < 200;
    if (selectedPrice === "200to400")  priceOk = p >= 200 && p <= 400;
    if (selectedPrice === "Above400")  priceOk = p > 400;

    return catOk && srchOk && dietOk && priceOk;
  });

  return (
    <div className="bg-black min-h-screen text-white pb-20">

      {/* ══════════════════════ HERO ══════════════════════ */}
      <div className="relative h-[480px] w-full overflow-hidden border-b border-zinc-900">
        {heroImages.map((img, idx) => (
          <img
            key={idx}
            src={img}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              activeHero === idx ? "opacity-50" : "opacity-0"
            }`}
            alt={heroAlts[idx]}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <span className="text-[#f5c27a] font-black tracking-[0.3em] text-xs mb-4 uppercase">
            Authentic South Indian Flavours
          </span>
          <h1 className="text-6xl md:text-7xl font-black tracking-tighter mb-4 flex items-center gap-4">
            <span style={{ color: "#ffffff" }}>OUR</span>
            <span style={{ color: "#f5c27a" }}>MENU</span>
          </h1>
          <div className="h-1.5 w-24 bg-[#f5c27a] rounded-full" />
        </div>
      </div>

      {/* ══════════════════════ FILTER PANEL ══════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 mt-12 space-y-8">
        <div className="bg-[#0a0a0a] p-6 rounded-[2rem] border border-zinc-900 space-y-5">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:w-1/3">
              <label htmlFor="menu-search" className="sr-only">Search for a dish</label>
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" aria-hidden="true">🔍</span>
              <input
                id="menu-search"
                type="text"
                placeholder="Search for a dish..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-[#f5c27a] outline-none text-sm"
              />
            </div>

            <label htmlFor="price-filter" className="sr-only">Filter by price</label>
            <select
              id="price-filter"
              value={selectedPrice}
              onChange={e => setSelectedPrice(e.target.value)}
              className="bg-black border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm font-semibold outline-none cursor-pointer focus:border-[#f5c27a]"
            >
              {PRICE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>

            <span className="ml-auto text-zinc-600 text-xs font-bold uppercase">
              {filteredItems.length} dishes found
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {DIET_FILTERS.map(({ label, value }) => {
              const col      = DIET_COLOURS[value];
              const isActive = selectedDiet === value;
              return (
                <button
                  key={value}
                  onClick={() => setSelectedDiet(value)}
                  className="px-5 py-2 rounded-xl font-bold text-xs uppercase transition-all"
                  style={{
                    background: isActive ? col.active : "transparent",
                    color:      isActive ? col.text   : "#666",
                    border:     `1px solid ${isActive ? col.active : "#2a2a2a"}`,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-zinc-900 pt-4">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="px-5 py-2 rounded-xl font-bold text-xs uppercase transition-all"
                style={{
                  background: selectedCategory === cat ? "#f5c27a" : "transparent",
                  color:      selectedCategory === cat ? "#000"    : "#555",
                  border:     `1px solid ${selectedCategory === cat ? "#f5c27a" : "#2a2a2a"}`,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════════ DISH GRID ══════════════════════ */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-zinc-700">
            <span className="text-5xl mb-4">🍽️</span>
            <p className="text-xl font-bold text-zinc-500">No dishes match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredItems.map(item => (
              <DishCard key={item._id || item.id || item.name} item={item} onAdd={handleAdd} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════ SUB-COMPONENT: DISH CARD ════════════════════ */
function DishCard({ item, onAdd }) {
  const [isAdded, setIsAdded] = React.useState(false);

  const optimizedImage = item.image?.includes("cloudinary")
    ? item.image.replace("/upload/", "/upload/w_400,c_fill,g_auto,f_auto,q_auto/")
    : item.image;

  const handleButtonClick = () => {
    onAdd(item);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] border border-zinc-900 rounded-[2rem] overflow-hidden group hover:border-[#f5c27a]/50 transition-all duration-500 shadow-xl hover:shadow-[0_0_30px_-10px_rgba(245,194,122,0.15)]">
      <div className="relative h-56 flex-shrink-0 overflow-hidden">
        <img
          src={optimizedImage}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10">
          <div
            className={`w-3 h-3 rounded-full ${item.veg ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-500 shadow-[0_0_8px_#ef4444]"}`}
            role="img"
            aria-label={item.veg ? "Vegetarian" : "Non-vegetarian"}
          />
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="mb-2">
          <h3 className="text-xl font-black tracking-tight text-white group-hover:text-[#f5c27a] transition-colors line-clamp-1">
            {item.name}
          </h3>
        </div>

        <p className="text-zinc-500 text-sm leading-relaxed line-clamp-3 mb-4">
          {item.description}
        </p>

        <div className="flex-grow" />

        <div className="pt-6 flex items-center justify-between border-t border-zinc-900/50 mt-2">
          <span className="text-[#f5c27a] font-black text-xl tracking-tighter">
            ₹{item.price}
          </span>
          <button
            onClick={handleButtonClick}
            disabled={isAdded}
            className={`flex-shrink-0 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 transform active:scale-95 shadow-lg ${
              isAdded
                ? "bg-green-500 text-white translate-y-0"
                : "bg-[#f5c27a] text-black hover:bg-white hover:-translate-y-1"
            }`}
          >
            {isAdded ? "Added! ✓" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}