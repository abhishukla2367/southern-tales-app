const express    = require("express");
const router     = express.Router();
const mongoose   = require("mongoose");
const MenuItem   = require("../models/Menu");
const { protect, admin } = require("../middleware/protect");
const cloudinary = require("cloudinary").v2;
const multer     = require("multer");

// --- MULTER SETUP ---
const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// --- CLOUDINARY UPLOAD HELPER ---
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "southern_tales_menu", use_filename: true },
      (error, result) => { if (error) reject(error); else resolve(result); }
    );
    stream.end(fileBuffer);
  });
};

// ✅ NORMALIZE HELPER
const normalize = (doc) => {
  const obj = doc && typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  obj._id   = obj._id ? obj._id.toString() : obj._id;
  delete obj.__v;
  return obj;
};

// ✅ RESOLVE QUERY HELPER
const resolveQuery = (id) => {
  if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
    return { $or: [{ _id: id }, { _id: new mongoose.Types.ObjectId(id) }] };
  }
  return { _id: id };
};

// --- 1. PUBLIC: GET ALL MENU ITEMS ---
router.get("/", async (req, res) => {
  try {
    const filter = req.query.category ? { category: req.query.category } : {};
    const items  = await MenuItem.find(filter).lean();

    const categoryOrder = ["breakfast", "starters", "main-course", "desserts", "beverages"];

    const sorted = items
      .sort((a, b) => {
        const ia = categoryOrder.indexOf(a.category?.toLowerCase());
        const ib = categoryOrder.indexOf(b.category?.toLowerCase());
        if (ia === ib)  return a.name.localeCompare(b.name);
        if (ia === -1)  return 1;
        if (ib === -1)  return -1;
        return ia - ib;
      })
      .map(normalize);

    res.status(200).json(sorted);
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching menu data" });
  }
});

// --- 2. ADMIN: ADD NEW ITEM ---
router.post("/", protect, admin, upload.single("image"), async (req, res) => {
  try {
    let imageUrl = "", cloudinaryId = "";

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl     = result.secure_url;
      cloudinaryId = result.public_id;
    }

    const { name, description, price, category, veg, vegan, dietary, available } = req.body;

    if (!name || !price || !category) {
      if (cloudinaryId) await cloudinary.uploader.destroy(cloudinaryId);
      return res.status(400).json({ success: false, message: "name, price, and category are required" });
    }

    const newId = new mongoose.Types.ObjectId().toHexString();

    const newItem = new MenuItem({
      _id:          newId,
      name,
      description:  description || "",
      price:        Number(price),
      category,
      image:        imageUrl,
      cloudinaryId,
      veg:          veg      ?? true,
      vegan:        vegan    ?? false,
      dietary:      dietary  ?? false,
      available:    available ?? true,
    });

    await newItem.save();
    res.status(201).json(normalize(newItem));
  } catch (err) {
    console.error("❌ Admin Add Error:", err);
    res.status(400).json({ success: false, message: "Upload failed", error: err.message });
  }
});

// --- 3. ADMIN: UPDATE ITEM ---
router.put("/:id", protect, admin, upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;

    const item = await MenuItem.findOne(resolveQuery(id));
    if (!item) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    let imageUrl     = item.image;
    let cloudinaryId = item.cloudinaryId;

    if (req.file) {
      if (item.cloudinaryId) await cloudinary.uploader.destroy(item.cloudinaryId);
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl     = result.secure_url;
      cloudinaryId = result.public_id;
    }

    const { name, description, price, category, veg, vegan, dietary } = req.body;
    const newStock     = req.body.stock !== undefined ? Number(req.body.stock) : item.stock;
    const newAvailable = newStock > 0;

    const updated = await MenuItem.findOneAndUpdate(
      { _id: item._id },
      {
        $set: {
          name, description, category,
          price:       price ? Number(price) : item.price,
          image:       imageUrl,
          cloudinaryId,
          veg, vegan, dietary,
          stock:       newStock,
          available:   newAvailable,
        },
      },
      { new: true, runValidators: true }
    );

    res.status(200).json(normalize(updated));
  } catch (err) {
    console.error("❌ Admin Update Error:", err.message);
    res.status(400).json({ success: false, message: "Update failed", error: err.message });
  }
});

// --- 4. ADMIN: DELETE ITEM ---
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const { id } = req.params;

    const item = await MenuItem.findOne(resolveQuery(id));
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    if (item.cloudinaryId) await cloudinary.uploader.destroy(item.cloudinaryId);

    await MenuItem.deleteOne({ _id: item._id });
    res.status(200).json({ success: true, message: "Item and image deleted successfully" });
  } catch (err) {
    console.error("❌ Admin Delete Error:", err.message);
    res.status(500).json({ success: false, message: "Delete failed", error: err.message });
  }
});

// --- 5. ADMIN: RESTOCK ITEM ---
router.patch("/:id/restock", protect, admin, async (req, res) => {
  try {
    const { id }   = req.params;
    const quantity = Number(req.body.quantity);

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: "quantity must be a positive number" });
    }

    const item = await MenuItem.findOne(resolveQuery(id));
    if (!item) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    const updated = await MenuItem.findOneAndUpdate(
      { _id: item._id },
      { $inc: { stock: quantity }, $set: { available: true } },
      { new: true }
    );

    res.status(200).json({ success: true, item: normalize(updated) });
  } catch (err) {
    console.error("❌ Restock Error:", err.message);
    res.status(500).json({ success: false, message: "Restock failed", error: err.message });
  }
});

module.exports = router;