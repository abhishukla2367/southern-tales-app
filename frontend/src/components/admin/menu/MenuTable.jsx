import React, { useState } from 'react';

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='52' height='52' viewBox='0 0 52 52'%3E%3Crect width='52' height='52' fill='%231a1a1a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='22' fill='%23444'%3E%F0%9F%8D%BD%EF%B8%8F%3C/text%3E%3C/svg%3E";

const STOCK_LOW_THRESHOLD = 5;

function getStockMeta(stock) {
  if (stock === 0) {
    return {
      label: "Out of Stock",
      dot:   "bg-red-400",
      badge: "bg-red-400/10 text-red-400",
      qty:   "text-red-400",
    };
  }
  if (stock <= STOCK_LOW_THRESHOLD) {
    return {
      label: "Low Stock",
      dot:   "bg-amber-400",
      badge: "bg-amber-400/10 text-amber-400",
      qty:   "text-amber-400",
    };
  }
  return {
    label: "Available",
    dot:   "bg-emerald-400",
    badge: "bg-emerald-400/10 text-emerald-400",
    qty:   "text-emerald-400",
  };
}

const getThumbnail = (url) => {
  if (!url || typeof url !== 'string') return FALLBACK_IMAGE;
  if (url.includes("res.cloudinary.com")) {
    return url.replace("/upload/", "/upload/w_200,c_fill,g_auto,f_auto,q_auto/");
  }
  return url;
};

// ─── Inline Restock Row ────────────────────────────────────────────────────────
function RestockCell({ item, onRestock }) {
  const [qty, setQty]         = useState("");
  const [loading, setLoading] = useState(false);

  const handleRestock = async () => {
    const parsed = parseInt(qty, 10);
    if (!parsed || parsed <= 0) return;
    setLoading(true);
    await onRestock(item, parsed);
    setQty("");
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-2">
      <input
        type="number"
        min="1"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        placeholder="Qty"
        className="w-16 text-center text-xs font-bold bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        onClick={handleRestock}
        disabled={loading || !qty}
        title="Restock"
        className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "..." : "Restock"}
      </button>
    </div>
  );
}

export default function MenuTable({ items, onEdit, onDelete, onRestock }) {

  if (!items || !items.length)
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-neutral-950 border border-neutral-900 rounded-2xl">
        <span className="text-4xl mb-4 text-neutral-800">🍽️</span>
        <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest">
          No menu items found
        </p>
      </div>
    );

  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">

          <thead>
            <tr className="bg-neutral-900 border-b border-neutral-800 text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500">
              <th className="px-6 py-5">#</th>
              <th className="px-6 py-5">Image</th>
              <th className="px-6 py-5">Item Details</th>
              <th className="px-6 py-5 text-right">Price</th>
              <th className="px-6 py-5 text-center">Stock</th>
              <th className="px-6 py-5 text-center">Status</th>
              <th className="px-6 py-5 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-900">
            {items.map((item, index) => {
              const stock     = typeof item.stock === 'number' ? item.stock : 0;
              const unit      = item.unit || "units"; // ← real unit from DB, fallback to "units"
              const meta      = getStockMeta(stock);
              const isOutOfStock = stock === 0;

              return (
                <tr
                  key={item._id || item.id || index}
                  className="group hover:bg-neutral-900/50 transition-all duration-200"
                >
                  {/* Index */}
                  <td className="px-6 py-4 text-xs font-mono text-neutral-700">
                    {String(index + 1).padStart(2, '0')}
                  </td>

                  {/* Image */}
                  <td className="px-6 py-4">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 group-hover:border-emerald-500/50 transition-colors">
                      <img
                        src={getThumbnail(item.image)}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = FALLBACK_IMAGE;
                        }}
                      />
                    </div>
                  </td>

                  {/* Item Details */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-neutral-100 group-hover:text-emerald-400 transition-colors">
                        {item.name}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-neutral-600 font-bold mt-0.5">
                        {item.category || "General"}
                      </span>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4 text-right">
                    <span className="font-black text-sm text-emerald-400">
                      ₹{item.price}
                    </span>
                  </td>

                  {/* Stock Quantity + Restock input when 0 */}
                  <td className="px-6 py-4 text-center">
                    <span className={`font-black text-sm tabular-nums ${meta.qty}`}>
                      {stock}
                    </span>
                    {/* ← Real unit from DB */}
                    <span className="text-[10px] text-neutral-600 ml-1">{unit}</span>

                    {/* Restock control — only shown when stock is 0 */}
                    {isOutOfStock && onRestock && (
                      <RestockCell item={item} onRestock={onRestock} />
                    )}
                  </td>

                  {/* Status — auto-derived from stock */}
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${meta.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${meta.dot}`} />
                      {meta.label}
                    </span>
                  </td>

                  {/* Actions — Edit & Delete */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {/* Edit */}
                      <button
                        onClick={() => onEdit(item)}
                        title="Edit item"
                        className="p-2 bg-neutral-800 hover:bg-emerald-500 text-neutral-400 hover:text-black rounded-lg transition-all duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                          <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.69,147.31,64l24-24L216,84.69Z" />
                        </svg>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDelete(item)}
                        title="Delete item"
                        className="p-2 bg-neutral-800 hover:bg-red-500 text-neutral-400 hover:text-white rounded-lg transition-all duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                          <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}