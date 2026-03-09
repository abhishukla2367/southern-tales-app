import React, { useState } from "react";
import useInventory from "../../../hooks/useInventory";

const UNITS = ["kg", "litre", "pcs", "roll"];

const CATEGORIES = [
  "Proteins",
  "Dairy",
  "Fresh Vegetables",
  "Grains & Flours",
  "Pulses & Lentils",
  "Spices & Masalas",
  "Oils & Fats",
  "Sweeteners",
  "Beverages",
  "Condiments",
  "Kitchen Supplies",
  "Linens",
  "Cleaning",
  "Service Supplies",
  "Safety",
];

function getStockMeta(currentStock, minRequired) {
  if (currentStock === 0) {
    return { label: "Out of Stock", dot: "bg-red-400", badge: "bg-red-400/10 text-red-400", qty: "text-red-400" };
  }
  if (currentStock <= (minRequired || 0)) {
    return { label: "Critical", dot: "bg-amber-400", badge: "bg-amber-400/10 text-amber-400", qty: "text-amber-400" };
  }
  return { label: "Optimal", dot: "bg-emerald-400", badge: "bg-emerald-400/10 text-emerald-400", qty: "text-emerald-400" };
}

function RestockCell({ item, onRestock }) {
  const [qty, setQty] = useState("");
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
      <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Qty"
        className="w-16 text-center text-xs font-bold bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-lg px-2 py-1 focus:outline-none focus:border-orange-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
      <button onClick={handleRestock} disabled={loading || !qty}
        className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500 hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed">
        {loading ? "..." : "Restock"}
      </button>
    </div>
  );
}

function DeleteModal({ item, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm p-8 shadow-2xl">
        <h3 className="text-base font-black text-neutral-100 mb-2">Delete Item?</h3>
        <p className="text-sm text-neutral-400 mb-6">
          <span className="text-neutral-100 font-bold">{item.itemName}</span> will be permanently removed from inventory.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-sm transition-all">Cancel</button>
          <button onClick={() => onConfirm(item)} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all">Delete</button>
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM = { itemName: "", category: "", currentStock: "", minRequired: "", unit: "kg" };

function InventoryModal({ editItem, onSave, onClose, isSaving }) {
  const [form, setForm] = useState(
    editItem
      ? { itemName: editItem.itemName, category: editItem.category, currentStock: editItem.currentStock, minRequired: editItem.minRequired, unit: editItem.unit || "kg" }
      : EMPTY_FORM
  );
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, currentStock: Number(form.currentStock), minRequired: Number(form.minRequired) });
  };
  const inputCls  = "w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-orange-500 transition-colors";
  const selectCls = inputCls + " font-bold text-neutral-300 cursor-pointer";
  const labelCls  = "block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1.5";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="px-8 py-6 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-neutral-100">{editItem ? "Edit Inventory Item" : "Add Inventory Item"}</h2>
            <p className="text-[11px] text-neutral-500 mt-0.5 uppercase tracking-wider font-bold">{editItem ? `Editing: ${editItem.itemName}` : "New stock entry"}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-100 rounded-lg transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
              <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className={labelCls}>Item Name</label>
            <input required name="itemName" value={form.itemName} onChange={handleChange} placeholder="e.g. Kashmiri Chili" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Category</label>
              <select required name="category" value={form.category} onChange={handleChange} className={selectCls}>
                <option value="" disabled>Select category</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Unit</label>
              <select name="unit" value={form.unit} onChange={handleChange} className={selectCls}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Current Stock</label>
              <input required type="number" min="0" step="any" name="currentStock" value={form.currentStock} onChange={handleChange} placeholder="0" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Min. Required</label>
              <input required type="number" min="0" step="any" name="minRequired" value={form.minRequired} onChange={handleChange} placeholder="10" className={inputCls} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-sm transition-all">Cancel</button>
            <button type="submit" disabled={isSaving} className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-sm transition-all disabled:opacity-50">
              {isSaving ? "Saving..." : editItem ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InventoryStats({ items }) {
  const total      = items.length;
  const critical   = items.filter(i => i.currentStock <= (i.minRequired || 0) && i.currentStock > 0).length;
  const outOfStock = items.filter(i => i.currentStock === 0).length;
  const optimal    = items.filter(i => i.currentStock > (i.minRequired || 0)).length;
  const stats = [
    { label: "Total Items",  value: total,      color: "text-neutral-100" },
    { label: "Optimal",      value: optimal,    color: "text-emerald-400" },
    { label: "Critical",     value: critical,   color: "text-amber-400"   },
    { label: "Out of Stock", value: outOfStock, color: "text-red-400"     },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      {stats.map(({ label, value, color }) => (
        <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{label}</p>
          <p className={`text-2xl font-black mt-1 tabular-nums ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}

export default function InventoryManagement({ onStockChange }) {
  const { inventoryItems, loading, error, saveItem, removeItem, restockItem } = useInventory();
  const [search, setSearch]             = useState("");
  const [showModal, setShowModal]       = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSaving, setIsSaving]         = useState(false);

  const filteredItems = inventoryItems.filter(item =>
    !search ||
    item.itemName?.toLowerCase().includes(search.toLowerCase()) ||
    item.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd  = () => { setEditItem(null); setShowModal(true); };
  const handleEdit = (item) => { setEditItem(item); setShowModal(true); };
  const handleSave = async (formData) => {
    setIsSaving(true);
    try { await saveItem(formData, editItem); setShowModal(false); onStockChange?.(); }
    catch (err) { console.error("Save failed:", err); }
    finally { setIsSaving(false); }
  };
  const handleDeleteConfirm = async (item) => {
    try { await removeItem(item); onStockChange?.(); }
    catch (err) { console.error("Delete failed:", err); }
    finally { setDeleteTarget(null); }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
        <p className="text-sm font-bold text-neutral-500">Loading inventory...</p>
      </div>
    );

  if (error) return <p className="text-center py-10 text-red-400">Failed to load inventory.</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-black text-neutral-100">Inventory Management</h2>
        <button onClick={handleAdd} className="bg-gradient-to-r from-orange-400 to-orange-600 text-black font-black text-sm px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-orange-900/40 transition-all">
          + Add Item
        </button>
      </div>

      <InventoryStats items={inventoryItems} />

      <div className="mb-4">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-600" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
            <path d="M229.66,218.34l-50.07-50.07a88.19,88.19,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.31ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"/>
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by item name or category..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-orange-500 transition-colors" />
        </div>
      </div>

      {!filteredItems.length ? (
        <div className="flex flex-col items-center justify-center py-20 bg-neutral-950 border border-neutral-900 rounded-2xl">
          <span className="text-4xl mb-4 text-neutral-800">📦</span>
          <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest">No inventory items found</p>
        </div>
      ) : (
        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-900 border-b border-neutral-800 text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500">
                  <th className="px-6 py-5">#</th>
                  <th className="px-6 py-5">Item Details</th>
                  <th className="px-6 py-5 text-center">Stock</th>
                  <th className="px-6 py-5 text-center">Min. Required</th>
                  <th className="px-6 py-5 text-center">Status</th>
                  <th className="px-6 py-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {filteredItems.map((item, index) => {
                  const stock        = typeof item.currentStock === "number" ? item.currentStock : 0;
                  const minReq       = typeof item.minRequired  === "number" ? item.minRequired  : 0;
                  const unit         = item.unit || "units";
                  const meta         = getStockMeta(stock, minReq);
                  const isOutOfStock = stock === 0;
                  return (
                    <tr key={item._id || index} className="group hover:bg-neutral-900/50 transition-all duration-200">
                      <td className="px-6 py-4 text-xs font-mono text-neutral-700">{String(index + 1).padStart(2, "0")}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-neutral-100 group-hover:text-orange-400 transition-colors">{item.itemName}</span>
                          <span className="text-[10px] uppercase tracking-wider text-neutral-600 font-bold mt-0.5">{item.category || "General"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-black text-sm tabular-nums ${meta.qty}`}>{stock}</span>
                        <span className="text-[10px] text-neutral-600 ml-1">{unit}</span>
                        {isOutOfStock && <RestockCell item={item} onRestock={async (i, q) => { await restockItem(i, q); onStockChange?.(); }} />}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-black text-sm tabular-nums text-neutral-400">{minReq}</span>
                        <span className="text-[10px] text-neutral-600 ml-1">{unit}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${meta.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEdit(item)} title="Edit item" className="p-2 bg-neutral-800 hover:bg-orange-500 text-neutral-400 hover:text-black rounded-lg transition-all duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                              <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.69,147.31,64l24-24L216,84.69Z" />
                            </svg>
                          </button>
                          <button onClick={() => setDeleteTarget(item)} title="Delete item" className="p-2 bg-neutral-800 hover:bg-red-500 text-neutral-400 hover:text-white rounded-lg transition-all duration-200">
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
      )}

      {showModal && (
        <InventoryModal editItem={editItem} onSave={handleSave} onClose={() => setShowModal(false)} isSaving={isSaving} />
      )}
      {deleteTarget && (
        <DeleteModal item={deleteTarget} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}