import { useEffect, useRef, useState } from "react";

const emptyForm = {
  name: "", category: "", price: "", description: "", available: true,
};

export default function MenuItemModal({ editItem, categories, onSave, onClose, isSaving }) {
  const [form, setForm]                 = useState(emptyForm);
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [errors, setErrors]             = useState({});
  const fileRef                         = useRef();

  // Strip "All" sentinel — it's only for the filter, not a real category
  const realCategories = categories.filter((c) => c !== "All");

  useEffect(() => {
    if (editItem) {
      setForm({
        name:        editItem.name        || "",
        category:    editItem.category    || "",
        price:       editItem.price       || "",
        description: editItem.description || "",
        available:   editItem.available   ?? true,
      });
      setImagePreview(editItem.image || "");
      setImageFile(null);
    } else {
      setForm({ ...emptyForm, category: realCategories[0] || "" });
      setImagePreview("");
      setImageFile(null);
    }
    setErrors({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editItem]);

  const handleImageFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setErrors((prev) => ({ ...prev, image: null }));
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())       errs.name     = "Dish name is required";
    if (!form.price)             errs.price    = "Price is required";
    if (Number(form.price) <= 0) errs.price    = "Price must be greater than 0";
    if (!form.category)          errs.category = "Category is required";
    if (!editItem && !imageFile) errs.image    = "Please select an image";
    return errs;
  };

  const handleSave = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    try {
      const formData = new FormData();
      formData.append("name",        form.name.trim());
      formData.append("price",       form.price);
      formData.append("category",    form.category);
      formData.append("description", form.description);
      formData.append("available",   form.available);
      if (imageFile) formData.append("image", imageFile);

      // ✅ Let the parent (MenuList) own the close — no onClose() here.
      //    MenuList.handleSave calls setShowModal(false) on success.
      await onSave(formData);

    } catch (err) {
      console.error("Save failed:", err);
      setErrors({
        submit: err.response?.data?.message || "Failed to save. Please try again.",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl p-7 overflow-y-auto max-h-[90vh] shadow-2xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black text-yellow-400 uppercase tracking-tight">
            {editItem ? "Edit Menu Item" : "Add New Item"}
          </h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-neutral-500 hover:text-neutral-300 text-xl cursor-pointer transition-colors disabled:opacity-30"
          >
            ✕
          </button>
        </div>

        {/* Submit error */}
        {errors.submit && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            ⚠ {errors.submit}
          </div>
        )}

        {/* Image Upload */}
        <div className="mb-6">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-2">
            Item Image {!editItem && <span className="text-red-500">*</span>}
          </label>

          <div
            onClick={() => fileRef.current.click()}
            className={`h-44 bg-neutral-900 border-2 border-dashed rounded-xl overflow-hidden flex items-center justify-center mb-2 cursor-pointer transition-all
              ${errors.image
                ? "border-red-500/60 hover:border-red-500"
                : imagePreview
                  ? "border-neutral-700"
                  : "border-neutral-800 hover:border-yellow-600/50"
              }`}
          >
            {imagePreview ? (
              <div className="relative w-full h-full group">
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white text-xs font-bold bg-black/60 px-3 py-1 rounded-full">Change Photo</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-neutral-600">
                <div className="text-4xl mb-2">📸</div>
                <div className="text-[11px] font-bold uppercase tracking-wider">Click to Select Image</div>
                <p className="text-[10px] mt-1 text-neutral-700">JPG, PNG or WEBP · Max 5MB</p>
              </div>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />

          {errors.image && (
            <p className="text-[11px] text-red-400 font-semibold mt-1">⚠ {errors.image}</p>
          )}

          {imagePreview && !errors.image && (
            <button
              onClick={() => { setImagePreview(""); setImageFile(null); }}
              className="text-[10px] text-red-500 font-bold uppercase tracking-widest hover:text-red-400 transition-colors mt-1"
            >
              Remove Image
            </button>
          )}
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Dish Name */}
          <div className="col-span-2">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-1.5">
              Dish Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm((p) => ({ ...p, name: e.target.value }));
                setErrors((p) => ({ ...p, name: null }));
              }}
              placeholder="e.g. Butter Chicken"
              className={`w-full bg-neutral-900 border text-neutral-100 text-sm rounded-lg px-4 py-3 outline-none transition-colors
                ${errors.name ? "border-red-500/60 focus:border-red-500" : "border-neutral-800 focus:border-yellow-500"}`}
            />
            {errors.name && <p className="text-[11px] text-red-400 font-semibold mt-1">⚠ {errors.name}</p>}
          </div>

          {/* Price */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-1.5">
              Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => {
                setForm((p) => ({ ...p, price: e.target.value }));
                setErrors((p) => ({ ...p, price: null }));
              }}
              placeholder="0.00"
              className={`w-full bg-neutral-900 border text-neutral-100 text-sm rounded-lg px-4 py-3 outline-none transition-colors
                ${errors.price ? "border-red-500/60 focus:border-red-500" : "border-neutral-800 focus:border-yellow-500"}`}
            />
            {errors.price && <p className="text-[11px] text-red-400 font-semibold mt-1">⚠ {errors.price}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category}
              onChange={(e) => {
                setForm((p) => ({ ...p, category: e.target.value }));
                setErrors((p) => ({ ...p, category: null }));
              }}
              className={`w-full bg-neutral-900 border text-neutral-100 text-sm rounded-lg px-4 py-3 outline-none transition-colors
                ${errors.category ? "border-red-500/60 focus:border-red-500" : "border-neutral-800 focus:border-yellow-500"}`}
            >
              {/* ✅ "All" is filtered out — only real categories shown */}
              {realCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <p className="text-[11px] text-red-400 font-semibold mt-1">⚠ {errors.category}</p>}
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Describe this delicious dish..."
            rows={3}
            className="w-full bg-neutral-900 border border-neutral-800 text-neutral-100 text-sm rounded-lg px-4 py-3 outline-none focus:border-yellow-500 transition-colors resize-none"
          />
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center gap-3 mb-8">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, available: !f.available }))}
            className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer border-none flex-shrink-0 ${form.available ? "bg-yellow-500" : "bg-neutral-800"}`}
          >
            <span className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${form.available ? "left-6" : "left-1"}`} />
          </button>
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">In Stock / Available</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 bg-transparent hover:bg-neutral-900 text-neutral-500 py-3 text-xs font-black uppercase tracking-widest transition-colors rounded-xl border border-neutral-800 disabled:opacity-30"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex-[2] rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all
              ${isSaving
                ? "bg-neutral-800 text-neutral-600 cursor-wait"
                : "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-lg shadow-yellow-900/20 hover:shadow-yellow-900/40"
              }`}
          >
            {isSaving ? "Uploading to Cloud..." : editItem ? "Update Item" : "Confirm & Add"}
          </button>
        </div>

      </div>
    </div>
  );
}