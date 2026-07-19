import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star, ThumbsUp, ArrowLeft, Loader2, Search,
  SlidersHorizontal, PlusCircle, X, CheckCircle2,
} from "lucide-react";
import { db } from "../firebase";
import {
  collection, onSnapshot, query, orderBy,
  serverTimestamp, addDoc, updateDoc, doc, increment,
} from "firebase/firestore";

// ─── Star Row ─────────────────────────────────────────────────────────────────
const StarRow = ({ rating, size = 14 }) => (
  <div className="flex items-center gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={size}
        className={i < rating ? "text-[#f5c27a] fill-[#f5c27a]" : "text-white/10"}
      />
    ))}
  </div>
);

// ─── Modal Star Picker ────────────────────────────────────────────────────────
const ModalStarPicker = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onChange(num)}
          aria-label={`Rate ${num} star${num > 1 ? "s" : ""}`}
          className="transition-transform active:scale-110"
        >
          <Star
            size={22}
            className={num <= value ? "text-[#f5c27a] fill-[#f5c27a]" : "text-white/10"}
          />
        </button>
      ))}
    </div>
  </div>
);

// ─── Review Card ──────────────────────────────────────────────────────────────
const ReviewCard = ({ review, onHelpful }) => {
  const [voted, setVoted] = useState(false);

  const handleHelpful = async () => {
    if (voted) return;
    setVoted(true);
    await onHelpful(review.id);
  };

  const initials = review.name
    ? review.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "GU";

  const timeAgo = (ts) => {
    if (!ts) return "Just now";
    const diff = Date.now() - ts.toMillis();
    const mins = Math.floor(diff / 60000);
    const hrs  = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1)  return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs  < 24) return `${hrs}h ago`;
    if (days < 30) return `${days}d ago`;
    return ts.toDate().toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  };

  return (
    <article className="bg-[#1a1712] border border-white/5 rounded-2xl p-7 flex flex-col gap-4 shadow-sm hover:border-[#f5c27a]/20 transition-all duration-300 h-full">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-yellow-600 flex items-center justify-center font-bold uppercase text-black text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-sm truncate">{review.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRow rating={review.overallRating || 0} />
            <span className="text-zinc-600 text-[10px]">{timeAgo(review.createdAt)}</span>
          </div>
        </div>
      </header>

      {review.overallDetail && (
        <p className="text-gray-300 text-sm italic leading-relaxed line-clamp-4">
          "{review.overallDetail}"
        </p>
      )}

      {(review.foodRating || review.serviceRating || review.ambienceRating) ? (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Food",     val: review.foodRating },
            { label: "Service",  val: review.serviceRating },
            { label: "Ambience", val: review.ambienceRating },
          ].map(({ label, val }) =>
            val ? (
              <div key={label} className="bg-white/5 rounded-lg px-3 py-2 text-center">
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
                <div className="flex justify-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={9} className={i < val ? "text-[#f5c27a] fill-[#f5c27a]" : "text-white/10"} />
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      ) : null}

      {review.likedMostDetail && (
        <div className="bg-[#f5c27a]/5 border border-[#f5c27a]/10 rounded-xl px-4 py-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#f5c27a]/50 mb-1">Loved</p>
          <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2">{review.likedMostDetail}</p>
        </div>
      )}

      <footer className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
        <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Verified Guest</span>
        <button
          onClick={handleHelpful}
          disabled={voted}
          aria-label="Mark as helpful"
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
            voted
              ? "border-[#f5c27a]/30 text-[#f5c27a] bg-[#f5c27a]/10"
              : "border-white/10 text-zinc-500 hover:border-[#f5c27a]/30 hover:text-[#f5c27a]"
          }`}
        >
          <ThumbsUp size={11} aria-hidden="true" />
          Helpful {review.helpful > 0 ? `(${review.helpful})` : ""}
        </button>
      </footer>
    </article>
  );
};

// ─── Write Review Modal ───────────────────────────────────────────────────────
const WriteReviewModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: "", foodRating: 0, serviceRating: 0, ambienceRating: 0,
    ambienceDetail: "", likedMostDetail: "", suggestionDetail: "",
    overallRating: 0, overallDetail: "",
  });
  const [errors,      setErrors]      = useState({});
  const [submitting,  setSubmitting]  = useState(false);
  const [success,     setSuccess]     = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (form.overallRating === 0) errs.overallRating = "Please select an overall rating";
    if (!form.overallDetail.trim() || form.overallDetail.length < 10)
      errs.overallDetail = "Please write at least 10 characters";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) return setErrors(errs);
    setSubmitting(true);
    try {
      await addDoc(collection(db, "reviews"), {
        name:             form.name.trim(),
        foodRating:       form.foodRating,
        serviceRating:    form.serviceRating,
        ambienceRating:   form.ambienceRating,
        ambienceDetail:   form.ambienceDetail.trim(),
        likedMostDetail:  form.likedMostDetail.trim(),
        suggestionDetail: form.suggestionDetail.trim(),
        overallRating:    form.overallRating,
        overallDetail:    form.overallDetail.trim(),
        helpful: 0,
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setTimeout(() => { onSuccess(); onClose(); }, 2500);
    } catch (err) {
      console.error("Error saving review:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Write a review"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#1a1712] border border-white/10 w-full max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
        <header className="sticky top-0 bg-[#1a1712]/95 backdrop-blur-sm p-6 border-b border-white/5 flex justify-between items-center z-20">
          <div>
            <h3 className="text-xl font-bold text-white">Review Southern Tales</h3>
            <p className="text-zinc-500 text-xs mt-0.5">Your review will appear live instantly</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={22} aria-hidden="true" />
          </button>
        </header>

        {success ? (
          <div className="flex flex-col items-center justify-center gap-5 py-20 text-center px-8">
            <div className="w-20 h-20 rounded-full bg-[#f5c27a]/10 border border-[#f5c27a]/30 flex items-center justify-center">
              <CheckCircle2 size={36} className="text-[#f5c27a]" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white mb-2">Thank You!</h3>
              <p className="text-zinc-400 text-sm">Your review is live and visible to all guests.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} autoComplete="off" className="p-8 flex flex-col gap-8">
            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="modal-name" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name *</label>
              <input
                id="modal-name"
                required
                autoComplete="off"
                placeholder="Your name"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-zinc-600 focus:border-[#f5c27a] outline-none transition-colors"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
            </div>

            {/* Food + Service */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ModalStarPicker label="Food Rating"    value={form.foodRating}    onChange={(v) => setForm({ ...form, foodRating: v })} />
              <ModalStarPicker label="Service Rating" value={form.serviceRating} onChange={(v) => setForm({ ...form, serviceRating: v })} />
            </div>

            {/* Ambience */}
            <div className="space-y-4">
              <ModalStarPicker label="Ambience Rating" value={form.ambienceRating} onChange={(v) => setForm({ ...form, ambienceRating: v })} />
              <textarea
                autoComplete="off"
                placeholder="Tell us about the ambience..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 h-20 resize-none text-white placeholder:text-zinc-600 focus:border-[#f5c27a] outline-none transition-colors text-sm"
                value={form.ambienceDetail}
                onChange={(e) => setForm({ ...form, ambienceDetail: e.target.value })}
              />
            </div>

            {/* Liked Most */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">What did you like most?</label>
              <textarea
                autoComplete="off"
                placeholder="Food, service, ambience, menu variety..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 h-20 resize-none text-white placeholder:text-zinc-600 focus:border-[#f5c27a] outline-none transition-colors text-sm"
                value={form.likedMostDetail}
                onChange={(e) => setForm({ ...form, likedMostDetail: e.target.value })}
              />
            </div>

            {/* Suggestions */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Suggestions for improvement</label>
              <textarea
                autoComplete="off"
                placeholder="What could we do better?"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 h-20 resize-none text-white placeholder:text-zinc-600 focus:border-[#f5c27a] outline-none transition-colors text-sm"
                value={form.suggestionDetail}
                onChange={(e) => setForm({ ...form, suggestionDetail: e.target.value })}
              />
            </div>

            {/* Overall */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <ModalStarPicker label="Overall Rating *" value={form.overallRating} onChange={(v) => setForm({ ...form, overallRating: v })} />
              {errors.overallRating && <p className="text-red-400 text-xs">{errors.overallRating}</p>}
              <textarea
                required
                autoComplete="off"
                placeholder="Share your overall experience in detail..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 h-28 resize-none text-white placeholder:text-zinc-600 focus:border-[#f5c27a] outline-none transition-colors text-sm"
                value={form.overallDetail}
                onChange={(e) => setForm({ ...form, overallDetail: e.target.value })}
              />
              {errors.overallDetail && <p className="text-red-400 text-xs">{errors.overallDetail}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full flex items-center justify-center gap-2.5 py-5 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg ${
                submitting
                  ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                  : "bg-[#f5c27a] hover:bg-[#e0af6b] text-black hover:scale-[1.01]"
              }`}
            >
              {submitting
                ? <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Submitting...</>
                : <><Star size={16} className="fill-black" aria-hidden="true" /> Submit Review</>
              }
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════
//   ALL REVIEWS PAGE
// ═════════════════════════════════════════════════════════════════
const AllReviews = () => {
  const navigate = useNavigate();

  const [reviews,        setReviews]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState("");
  const [filterRating,   setFilterRating]   = useState(0);   // 0 = all
  const [sortBy,         setSortBy]         = useState("rating"); // "rating" | "recent" | "helpful"
  const [showFilters,    setShowFilters]    = useState(false);
  const [isFormOpen,     setIsFormOpen]     = useState(false);
  const [visibleCount,   setVisibleCount]   = useState(9);

  // ── Fetch all reviews ──────────────────────────────────────────
  useEffect(() => {
    const q = query(
      collection(db, "reviews"),
      orderBy("overallRating", "desc"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Firestore error:", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleHelpful = async (reviewId) => {
    try {
      await updateDoc(doc(db, "reviews", reviewId), { helpful: increment(1) });
    } catch (err) {
      console.error("Error updating helpful:", err);
    }
  };

  // ── Filter + Sort ──────────────────────────────────────────────
  const filtered = reviews
    .filter((r) => {
      const matchesSearch =
        search.trim() === "" ||
        r.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.overallDetail?.toLowerCase().includes(search.toLowerCase()) ||
        r.likedMostDetail?.toLowerCase().includes(search.toLowerCase());
      const matchesRating = filterRating === 0 || r.overallRating === filterRating;
      return matchesSearch && matchesRating;
    })
    .sort((a, b) => {
      if (sortBy === "rating")  return (b.overallRating || 0) - (a.overallRating || 0);
      if (sortBy === "helpful") return (b.helpful || 0) - (a.helpful || 0);
      if (sortBy === "recent") {
        const at = a.createdAt?.toMillis() || 0;
        const bt = b.createdAt?.toMillis() || 0;
        return bt - at;
      }
      return 0;
    });

  const visible    = filtered.slice(0, visibleCount);
  const avgRating  = reviews.length
    ? (reviews.reduce((s, r) => s + (r.overallRating || 0), 0) / reviews.length).toFixed(1)
    : "–";
  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.overallRating === star).length,
    pct:   reviews.length
      ? Math.round((reviews.filter((r) => r.overallRating === star).length / reviews.length) * 100)
      : 0,
  }));

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ── Hero ── */}
      <div className="relative pt-32 pb-16 px-6 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#f5c27a]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <button
            onClick={() => navigate("/contactus")}
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-[#f5c27a] text-sm font-medium mb-8 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Contact
          </button>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight tracking-tight">
            Guest <span className="text-[#f5c27a]">Reviews</span>
          </h1>
          <p className="text-zinc-400 text-lg font-light">
            Real experiences from our valued guests.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">

        {/* ── Stats Bar ── */}
        {!loading && reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">

            {/* Average Rating */}
            <div className="bg-[#0d0d0d] border border-zinc-800/80 rounded-3xl p-8 flex items-center gap-8">
              <div className="text-center flex-shrink-0">
                <p className="text-7xl font-black text-[#f5c27a] leading-none">{avgRating}</p>
                <div className="flex justify-center mt-2">
                  <StarRow rating={Math.round(parseFloat(avgRating))} size={16} />
                </div>
                <p className="text-zinc-500 text-xs mt-1">{reviews.length} reviews</p>
              </div>
              <div className="flex-1 space-y-2">
                {ratingDist.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 w-2">{star}</span>
                    <Star size={10} className="text-[#f5c27a] fill-[#f5c27a] flex-shrink-0" />
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#f5c27a] rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-600 w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Write Review CTA */}
            <div className="bg-gradient-to-br from-[#f5c27a]/10 to-transparent border border-[#f5c27a]/20 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f5c27a]/60 mb-2">Share Your Experience</p>
                <h3 className="text-2xl font-black text-white mb-3">Dined with us recently?</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Your feedback helps us serve you better and helps other guests make informed decisions.
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(true)}
                className="mt-6 flex items-center justify-center gap-2 bg-[#f5c27a] text-black px-6 py-3.5 rounded-full font-bold hover:bg-[#e0af6b] transition-all shadow-xl"
              >
                <PlusCircle size={18} aria-hidden="true" /> Write a Review
              </button>
            </div>
          </div>
        )}

        {/* ── Search + Filter Bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setVisibleCount(9); }}
              className="w-full bg-[#0d0d0d] border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-zinc-600 focus:border-[#f5c27a] focus:ring-2 focus:ring-[#f5c27a]/20 outline-none transition-all text-sm"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setVisibleCount(9); }}
            className="bg-[#0d0d0d] border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-[#f5c27a] outline-none transition-all cursor-pointer"
          >
            <option value="rating">Highest Rated</option>
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
          </select>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
              showFilters || filterRating > 0
                ? "border-[#f5c27a]/40 text-[#f5c27a] bg-[#f5c27a]/10"
                : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            Filter {filterRating > 0 ? `(${filterRating}★)` : ""}
          </button>

          {!loading && reviews.length === 0 && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 bg-[#f5c27a] text-black px-5 py-3 rounded-xl font-bold hover:bg-[#e0af6b] transition-all text-sm whitespace-nowrap"
            >
              <PlusCircle size={16} /> Write a Review
            </button>
          )}
        </div>

        {/* ── Filter Panel ── */}
        {showFilters && (
          <div className="bg-[#0d0d0d] border border-zinc-800/80 rounded-2xl p-5 mb-8 flex flex-wrap items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mr-2">Filter by rating:</p>
            {[0, 5, 4, 3, 2, 1].map((r) => (
              <button
                key={r}
                onClick={() => { setFilterRating(r); setVisibleCount(9); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                  filterRating === r
                    ? "border-[#f5c27a] bg-[#f5c27a]/10 text-[#f5c27a]"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                {r === 0 ? "All" : <><Star size={10} className="fill-[#f5c27a] text-[#f5c27a]" /> {r} Stars</>}
              </button>
            ))}
            {filterRating > 0 && (
              <button
                onClick={() => setFilterRating(0)}
                className="ml-auto text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
              >
                <X size={12} /> Clear filter
              </button>
            )}
          </div>
        )}

        {/* ── Results count ── */}
        {!loading && (
          <p className="text-zinc-600 text-xs uppercase tracking-widest mb-6">
            {filtered.length === 0
              ? "No reviews found"
              : `Showing ${Math.min(visibleCount, filtered.length)} of ${filtered.length} review${filtered.length !== 1 ? "s" : ""}`
            }
          </p>
        )}

        {/* ── Reviews Grid ── */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={36} className="text-[#f5c27a] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[#f5c27a]/10 border border-[#f5c27a]/20 flex items-center justify-center">
              <Star size={24} className="text-[#f5c27a]" />
            </div>
            <p className="text-white font-bold text-lg">
              {search || filterRating > 0 ? "No reviews match your filter" : "No reviews yet"}
            </p>
            <p className="text-zinc-500 text-sm">
              {search || filterRating > 0 ? "Try adjusting your search or filter." : "Be the first to share your experience!"}
            </p>
            {!search && filterRating === 0 && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="mt-2 flex items-center gap-2 bg-[#f5c27a] text-black px-6 py-3 rounded-full font-bold hover:bg-[#e0af6b] transition-all"
              >
                <PlusCircle size={16} /> Write a Review
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visible.map((review) => (
                <ReviewCard key={review.id} review={review} onHelpful={handleHelpful} />
              ))}
            </div>

            {/* Load More */}
            {visibleCount < filtered.length && (
              <div className="text-center mt-12">
                <button
                  onClick={() => setVisibleCount((p) => p + 9)}
                  className="px-10 py-4 rounded-full border border-[#f5c27a]/30 text-[#f5c27a] font-bold hover:bg-[#f5c27a]/10 transition-all text-sm"
                >
                  Load More Reviews ({filtered.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Write Review Modal ── */}
      {isFormOpen && (
        <WriteReviewModal
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default AllReviews;