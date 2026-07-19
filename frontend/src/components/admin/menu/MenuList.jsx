import { useState } from "react";
import useMenu       from "../../../hooks/useMenu";
import MenuStats     from "./MenuStats";
import MenuFilters   from "./MenuFilters";
import MenuTable     from "./MenuTable";
import MenuItemModal from "./MenuItemModal";

export default function MenuList() {
  const {
    menuItems, categories, loading, error,
    saveItem, removeItem, restockItem,   // ← restockItem added
  } = useMenu();

  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch]                 = useState("");
  const [dietFilter, setDietFilter]         = useState("all");
  const [priceFilter, setPriceFilter]       = useState("All Prices");
  const [showModal, setShowModal]           = useState(false);
  const [editItem, setEditItem]             = useState(null);
  const [isSaving, setIsSaving]             = useState(false);

  const filteredItems = menuItems.filter((item) => {
    const catMatch = activeCategory === "All" || item.category === activeCategory;
    const q = search.toLowerCase();
    const searchMatch = !q || 
      item.name?.toLowerCase().includes(q) || 
      item.category?.toLowerCase().includes(q) || 
      item.description?.toLowerCase().includes(q);

    const dietMatch =
      dietFilter === "all"     ? true :
      dietFilter === "veg"     ? item.veg === true && !item.vegan :
      dietFilter === "non-veg" ? item.veg === false :
      dietFilter === "vegan"   ? item.vegan === true :
      dietFilter === "dietary" ? item.dietary === true : true;

    const p = item.price ?? 0;
    const priceMatch =
      priceFilter === "All Prices"   ? true :
      priceFilter === "Under ₹100"   ? p < 100 :
      priceFilter === "₹100 – ₹200"  ? p >= 100 && p <= 200 :
      priceFilter === "₹200 – ₹500"  ? p > 200 && p <= 500 :
      priceFilter === "Above ₹500"   ? p > 500 : true;

    return catMatch && searchMatch && dietMatch && priceMatch;
  });

  const handleAdd  = () => { setEditItem(null); setShowModal(true); };
  const handleEdit = (item) => { setEditItem(item); setShowModal(true); };

  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      await saveItem(formData, editItem);
      setShowModal(false);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
        <p className="text-sm font-bold text-neutral-500">Loading menu...</p>
      </div>
    );

  if (error) return <p className="text-center py-10 text-red-400">Failed to load menu items.</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-black text-neutral-100">Menu Management</h2>
        <button
          onClick={handleAdd}
          className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black text-sm px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-yellow-900/40 transition-all"
        >
          + Add Item
        </button>
      </div>

      <MenuStats menuItems={menuItems} />

      <MenuFilters
        search={search}
        onSearchChange={setSearch}
        priceFilter={priceFilter}
        onPriceChange={setPriceFilter}
        dietFilter={dietFilter}
        onDietChange={setDietFilter}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        totalCount={filteredItems.length}
      />

      <MenuTable
        items={filteredItems}
        onEdit={handleEdit}
        onDelete={removeItem}
        onRestock={restockItem}   // ← passed down
      />

      {showModal && (
        <MenuItemModal
          editItem={editItem}
          categories={categories}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}