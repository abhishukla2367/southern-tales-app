import React, { useState, useEffect } from "react";
import { Mail, User, Send, MapPin, Phone, Clock, CheckCircle2, Star, ThumbsUp, X, PlusCircle, Loader2 } from "lucide-react";
import { db } from "../firebase";
import {
  collection, addDoc, onSnapshot, query,
  orderBy, limit, serverTimestamp, updateDoc, doc, increment,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
const PHONE = "919876543210";
const WHATSAPP_MESSAGE = encodeURIComponent("Hello! I'd like to enquire about Southern Tales Restaurant.");

const WhatsAppIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const StarRow = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star key={i} size={14} className={i < rating ? "text-[#f5c27a] fill-[#f5c27a]" : "text-white/10"} />
    ))}
  </div>
);

const ModalStarPicker = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((num) => (
        <button key={num} type="button" onClick={() => onChange(num)} aria-label={`Rate ${num} star${num > 1 ? "s" : ""}`} className="transition-transform active:scale-110">
          <Star size={22} className={num <= value ? "text-[#f5c27a] fill-[#f5c27a]" : "text-white/10"} aria-hidden="true" />
        </button>
      ))}
    </div>
  </div>
);

const ReviewCard = ({ review, onHelpful }) => {
  const [voted, setVoted] = useState(false);
  const handleHelpful = async () => { if (voted) return; setVoted(true); await onHelpful(review.id); };
  const initials = review.name ? review.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "GU";
  const timeAgo = (ts) => {
    if (!ts) return "Just now";
    const diff = Date.now() - ts.toMillis();
    const mins = Math.floor(diff / 60000), hrs = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days < 30) return `${days}d ago`;
    return ts.toDate().toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  };
  return (
    <article className="bg-[#1a1712] border border-white/5 rounded-2xl p-7 flex flex-col gap-4 shadow-sm hover:border-[#f5c27a]/20 transition-all duration-300">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-yellow-600 flex items-center justify-center font-bold uppercase text-black text-sm flex-shrink-0">{initials}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-sm truncate">{review.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRow rating={review.overallRating || 0} />
            <span className="text-zinc-600 text-[10px]">{timeAgo(review.createdAt)}</span>
          </div>
        </div>
      </header>
      {review.overallDetail && <p className="text-gray-300 text-sm italic leading-relaxed line-clamp-4">"{review.overallDetail}"</p>}
      {(review.foodRating || review.serviceRating || review.ambienceRating) ? (
        <div className="grid grid-cols-3 gap-2">
          {[{ label: "Food", val: review.foodRating }, { label: "Service", val: review.serviceRating }, { label: "Ambience", val: review.ambienceRating }]
            .map(({ label, val }) => val ? (
              <div key={label} className="bg-white/5 rounded-lg px-3 py-2 text-center">
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
                <div className="flex justify-center gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} size={9} className={i < val ? "text-[#f5c27a] fill-[#f5c27a]" : "text-white/10"} />)}</div>
              </div>
            ) : null)}
        </div>
      ) : null}
      {review.likedMostDetail && (
        <div className="bg-[#f5c27a]/5 border border-[#f5c27a]/10 rounded-xl px-4 py-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#f5c27a]/50 mb-1">Loved</p>
          <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2">{review.likedMostDetail}</p>
        </div>
      )}
      <footer className="flex items-center justify-between pt-3 border-t border-white/5">
        <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Verified Guest</span>
        <button onClick={handleHelpful} disabled={voted} aria-label="Mark as helpful"
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${voted ? "border-[#f5c27a]/30 text-[#f5c27a] bg-[#f5c27a]/10" : "border-white/10 text-zinc-500 hover:border-[#f5c27a]/30 hover:text-[#f5c27a]"}`}>
          <ThumbsUp size={11} aria-hidden="true" /> Helpful {review.helpful > 0 ? `(${review.helpful})` : ""}
        </button>
      </footer>
    </article>
  );
};

const InfoCard = ({ icon, title, children }) => (
  <div className="bg-[#0d0d0d] border border-zinc-800/80 rounded-2xl p-6 flex items-start gap-5 hover:border-[#f5c27a]/30 transition-all duration-300 group">
    <div className="w-12 h-12 rounded-xl bg-[#f5c27a]/10 border border-[#f5c27a]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#f5c27a]/20 transition-colors">{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">{title}</p>
      {children}
    </div>
  </div>
);

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // ── Reviews: top 3 by rating ──
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [modalForm, setModalForm] = useState({
    name: "", foodRating: 0, serviceRating: 0, ambienceRating: 0,
    ambienceDetail: "", likedMostDetail: "", suggestionDetail: "",
    overallRating: 0, overallDetail: "",
  });
  const [modalErrors, setModalErrors] = useState({});
  const navigate = useNavigate();

  // ── Firestore: fetch top 3 by highest overall rating ──
  useEffect(() => {
    const q = query(
      collection(db, "reviews"),
      orderBy("overallRating", "desc"),
      orderBy("createdAt", "desc"),
      limit(3)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setReviewsLoading(false);
    }, (err) => { console.error("Firestore error:", err); setReviewsLoading(false); });
    return () => unsub();
  }, []);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false); setIsSent(true);
      setForm({ name: "", email: "", message: "" });
      setTimeout(() => setIsSent(false), 6000);
    }, 1500);
  };

  const validateModal = () => {
    const errs = {};
    if (!modalForm.name.trim()) errs.name = "Name is required";
    if (modalForm.overallRating === 0) errs.overallRating = "Please select an overall rating";
    if (!modalForm.overallDetail.trim() || modalForm.overallDetail.length < 10)
      errs.overallDetail = "Please write at least 10 characters";
    return errs;
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const errs = validateModal();
    if (Object.keys(errs).length > 0) return setModalErrors(errs);
    setIsSubmittingReview(true);
    try {
      await addDoc(collection(db, "reviews"), {
        name: modalForm.name.trim(),
        foodRating: modalForm.foodRating, serviceRating: modalForm.serviceRating,
        ambienceRating: modalForm.ambienceRating, ambienceDetail: modalForm.ambienceDetail.trim(),
        likedMostDetail: modalForm.likedMostDetail.trim(), suggestionDetail: modalForm.suggestionDetail.trim(),
        overallRating: modalForm.overallRating, overallDetail: modalForm.overallDetail.trim(),
        helpful: 0, createdAt: serverTimestamp(),
      });
      setReviewSuccess(true);
      setModalForm({ name: "", foodRating: 0, serviceRating: 0, ambienceRating: 0, ambienceDetail: "", likedMostDetail: "", suggestionDetail: "", overallRating: 0, overallDetail: "" });
      setModalErrors({});
      setTimeout(() => { setReviewSuccess(false); setIsFormOpen(false); }, 3000);
    } catch (err) { console.error("Error saving review:", err); }
    finally { setIsSubmittingReview(false); }
  };

  const handleHelpful = async (reviewId) => {
    try { await updateDoc(doc(db, "reviews", reviewId), { helpful: increment(1) }); }
    catch (err) { console.error("Error updating helpful:", err); }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / reviews.length).toFixed(1)
    : "–";

  const inputBase = "w-full bg-[#141414] rounded-xl border border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#f5c27a] focus:ring-2 focus:ring-[#f5c27a]/20 outline-none transition-all duration-200 text-sm";

  return (
    <section className="min-h-screen bg-black text-white">

      {/* Hero */}
      <div className="relative pt-32 pb-20 px-6 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#f5c27a]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <span className="inline-block text-[10px] font-black uppercase tracking-[0.35em] text-[#f5c27a]/60 mb-4 px-4 py-1.5 rounded-full border border-[#f5c27a]/20 bg-[#f5c27a]/5">We'd Love to Hear From You</span>
          <h1 className="text-5xl md:text-6xl font-black text-white mt-4 mb-4 leading-tight tracking-tight">Get in <span className="text-[#f5c27a]">Touch</span></h1>
          <p className="text-zinc-400 text-lg font-light">Questions, reservations, or just a hello — we're always here for you.</p>
        </div>
      </div>

      {/* Contact Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid lg:grid-cols-2 gap-10 items-start">

          {/* LEFT: Contact Form */}
          <div className="relative bg-[#0d0d0d] border border-zinc-800/80 rounded-3xl shadow-2xl p-8 md:p-10 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f5c27a] to-transparent" />
            {isSent ? (
              <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center"><CheckCircle2 className="text-green-400" size={36} /></div>
                <div><h3 className="text-2xl font-black text-white mb-1">Message Sent!</h3><p className="text-zinc-400 text-sm">We'll get back to you within 24 hours.</p></div>
                <button onClick={() => setIsSent(false)} className="mt-2 px-6 py-2 rounded-xl border border-zinc-700 text-zinc-300 text-sm hover:border-[#f5c27a]/40 hover:text-[#f5c27a] transition-all">Send Another Message</button>
              </div>
            ) : (
              <>
                <div className="mb-8"><h2 className="text-2xl font-black text-white mb-1">Send a Message</h2><p className="text-zinc-500 text-sm">Fill out the form and our team will respond shortly.</p></div>
                <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label htmlFor="contact-name" className="text-[10px] font-black uppercase tracking-widest text-[#f5c27a]/70">Full Name</label>
                      <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} aria-hidden="true" />
                        <input id="contact-name" type="text" name="name" autoComplete="off" placeholder="Your Name" value={form.name} onChange={handleChange} className={`${inputBase} pl-11 pr-4 py-3.5`} required />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="contact-email" className="text-[10px] font-black uppercase tracking-widest text-[#f5c27a]/70">Email Address</label>
                      <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} aria-hidden="true" />
                        <input id="contact-email" type="email" name="email" autoComplete="off" placeholder="hello@example.com" value={form.email} onChange={handleChange} className={`${inputBase} pl-11 pr-4 py-3.5`} required />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-message" className="text-[10px] font-black uppercase tracking-widest text-[#f5c27a]/70">Your Message</label>
                    <textarea id="contact-message" name="message" autoComplete="off" placeholder="How can we help you? Ask about reservations, menu, events..." value={form.message} onChange={handleChange} rows={5} className={`${inputBase} p-4 resize-none`} required />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <button type="submit" disabled={isSubmitting} className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all active:scale-[0.98] shadow-lg ${isSubmitting ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-500 text-white shadow-orange-900/30"}`}>
                      {isSubmitting ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" aria-hidden="true" /> : <><Send size={15} aria-hidden="true" /> Send Message</>}
                    </button>
                    <a href={`https://wa.me/${PHONE}?text=${WHATSAPP_MESSAGE}`} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp" className="flex-1 flex items-center justify-center gap-2.5 py-4 rounded-xl font-black text-sm uppercase tracking-wider bg-[#25D366] hover:bg-[#20bd5a] text-white transition-all active:scale-[0.98] shadow-lg shadow-green-900/20">
                      <WhatsAppIcon size={18} /> WhatsApp
                    </a>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* RIGHT: Info Cards + Map */}
          <div className="flex flex-col gap-4">
            <InfoCard icon={<MapPin size={20} className="text-[#f5c27a]" aria-hidden="true" />} title="Visit Us">
              <p className="text-white font-semibold text-sm leading-snug">Sector 15, CBD Belapur</p>
              <p className="text-zinc-400 text-sm mt-0.5">Navi Mumbai, Maharashtra 400614</p>
              <p className="text-zinc-500 text-sm mt-0.5">India</p>
            </InfoCard>
            <InfoCard icon={<Phone size={20} className="text-[#f5c27a]" aria-hidden="true" />} title="Call Us">
              <a href="tel:+919876543210" className="block text-white font-semibold text-sm hover:text-[#f5c27a] transition-colors duration-200">+91 98765 43210</a>
              <a href="tel:+912227651234" className="block text-zinc-400 text-sm mt-0.5 hover:text-[#f5c27a] transition-colors duration-200">+91 22 2765 1234</a>
            </InfoCard>
            <InfoCard icon={<Mail size={20} className="text-[#f5c27a]" aria-hidden="true" />} title="Email Us">
              <a href="mailto:hello@southerntales.in" className="block text-white font-semibold text-sm hover:text-[#f5c27a] transition-colors duration-200 break-all">hello@southerntales.in</a>
              <a href="mailto:reservations@southerntales.in" className="block text-zinc-400 text-sm mt-0.5 hover:text-[#f5c27a] transition-colors duration-200 break-all">reservations@southerntales.in</a>
            </InfoCard>
            <InfoCard icon={<Clock size={20} className="text-[#f5c27a]" aria-hidden="true" />} title="Business Hours">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4"><p className="text-white font-semibold text-sm">Monday – Friday</p><p className="text-zinc-400 text-sm whitespace-nowrap">7:00 AM – 10:30 PM</p></div>
                <div className="flex items-center justify-between gap-4"><p className="text-white font-semibold text-sm">Saturday – Sunday</p><p className="text-zinc-400 text-sm whitespace-nowrap">8:00 AM – 11:00 PM</p></div>
              </div>
            </InfoCard>
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800/80 h-64 group">
              <iframe title="Southern Tales location map – CBD Belapur, Navi Mumbai"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.441113264423!2d73.0334803!3d19.0113111!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c3dadf000001%3A0x633d9c88220f8c37!2sCBD%20Belapur%2C%20Navi%20Mumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                className="w-full h-full border-0 grayscale group-hover:grayscale-0 transition-all duration-700 opacity-80 group-hover:opacity-100"
                allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </div>
        </div>
      </div>

      {/* Guest Reviews — Top 3 only */}
      <div className="border-t border-zinc-900 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Guest <span className="text-[#f5c27a]">Reviews</span></h2>
              <p className="text-zinc-500 text-sm">Our top-rated experiences — shared by real guests.</p>
            </div>
            <div className="flex items-center gap-6">
              {reviews.length > 0 && (
                <div className="flex items-center gap-3 bg-[#0d0d0d] border border-zinc-800 rounded-2xl px-5 py-3">
                  <div className="text-center">
                    <p className="text-3xl font-black text-[#f5c27a] leading-none">{avgRating}</p>
                    <p className="text-zinc-600 text-[10px] mt-0.5">Top rated</p>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} size={10} className={i < Math.round(parseFloat(avgRating)) ? "text-[#f5c27a] fill-[#f5c27a]" : "text-white/10"} />)}
                  </div>
                </div>
              )}
              <button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 bg-[#f5c27a] text-black px-6 py-3.5 rounded-full font-bold hover:bg-[#e0af6b] transition-all shadow-xl whitespace-nowrap">
                <PlusCircle size={18} aria-hidden="true" /> Write a Review
              </button>
            </div>
          </div>

          {reviewsLoading ? (
            <div className="flex items-center justify-center py-24"><Loader2 size={32} className="text-[#f5c27a] animate-spin" /></div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[#f5c27a]/10 border border-[#f5c27a]/20 flex items-center justify-center"><Star size={24} className="text-[#f5c27a]" /></div>
              <p className="text-white font-bold text-lg">No reviews yet</p>
              <p className="text-zinc-500 text-sm">Be the first to share your experience!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reviews.map((review) => <ReviewCard key={review.id} review={review} onHelpful={handleHelpful} />)}
              </div>

              {reviews.length > 0 && (
                <div className="text-center mt-10">
                  <button
                    onClick={() => navigate("/reviews")}
                    className="px-8 py-3.5 rounded-full border border-[#f5c27a]/30 text-[#f5c27a] font-bold hover:bg-[#f5c27a]/10 transition-all text-sm"
                  >
                    View All Reviews →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {isFormOpen && (
        <div role="dialog" aria-modal="true" aria-label="Write a review"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && setIsFormOpen(false)}>
          <div className="bg-[#1a1712] border border-white/10 w-full max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
            <header className="sticky top-0 bg-[#1a1712]/95 backdrop-blur-sm p-6 border-b border-white/5 flex justify-between items-center z-20">
              <div><h3 className="text-xl font-bold text-white">Review Southern Tales</h3><p className="text-zinc-500 text-xs mt-0.5">Your review will appear live instantly</p></div>
              <button onClick={() => setIsFormOpen(false)} aria-label="Close" className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={22} aria-hidden="true" /></button>
            </header>

            {reviewSuccess ? (
              <div className="flex flex-col items-center justify-center gap-5 py-20 text-center px-8">
                <div className="w-20 h-20 rounded-full bg-[#f5c27a]/10 border border-[#f5c27a]/30 flex items-center justify-center"><CheckCircle2 size={36} className="text-[#f5c27a]" /></div>
                <div><h3 className="text-2xl font-black text-white mb-2">Thank You!</h3><p className="text-zinc-400 text-sm">Your review is live and visible to all guests.</p></div>
              </div>
            ) : (
              <form onSubmit={handleModalSubmit} autoComplete="off" className="p-8 flex flex-col gap-8">
                <div className="space-y-2">
                  <label htmlFor="modal-name" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name *</label>
                  <input id="modal-name" required autoComplete="off" placeholder="Your name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-zinc-600 focus:border-[#f5c27a] outline-none transition-colors"
                    value={modalForm.name} onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })} />
                  {modalErrors.name && <p className="text-red-400 text-xs">{modalErrors.name}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ModalStarPicker label="Food Rating" value={modalForm.foodRating} onChange={(v) => setModalForm({ ...modalForm, foodRating: v })} />
                  <ModalStarPicker label="Service Rating" value={modalForm.serviceRating} onChange={(v) => setModalForm({ ...modalForm, serviceRating: v })} />
                </div>
                <div className="space-y-4">
                  <ModalStarPicker label="Ambience Rating" value={modalForm.ambienceRating} onChange={(v) => setModalForm({ ...modalForm, ambienceRating: v })} />
                  <textarea autoComplete="off" placeholder="Tell us about the ambience..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 h-20 resize-none text-white placeholder:text-zinc-600 focus:border-[#f5c27a] outline-none transition-colors text-sm"
                    value={modalForm.ambienceDetail} onChange={(e) => setModalForm({ ...modalForm, ambienceDetail: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">What did you like most?</label>
                  <textarea autoComplete="off" placeholder="Food, service, ambience, menu variety..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 h-20 resize-none text-white placeholder:text-zinc-600 focus:border-[#f5c27a] outline-none transition-colors text-sm"
                    value={modalForm.likedMostDetail} onChange={(e) => setModalForm({ ...modalForm, likedMostDetail: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Suggestions for improvement</label>
                  <textarea autoComplete="off" placeholder="What could we do better?"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 h-20 resize-none text-white placeholder:text-zinc-600 focus:border-[#f5c27a] outline-none transition-colors text-sm"
                    value={modalForm.suggestionDetail} onChange={(e) => setModalForm({ ...modalForm, suggestionDetail: e.target.value })} />
                </div>
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <ModalStarPicker label="Overall Rating *" value={modalForm.overallRating} onChange={(v) => setModalForm({ ...modalForm, overallRating: v })} />
                  {modalErrors.overallRating && <p className="text-red-400 text-xs">{modalErrors.overallRating}</p>}
                  <textarea required autoComplete="off" placeholder="Share your overall experience in detail..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 h-28 resize-none text-white placeholder:text-zinc-600 focus:border-[#f5c27a] outline-none transition-colors text-sm"
                    value={modalForm.overallDetail} onChange={(e) => setModalForm({ ...modalForm, overallDetail: e.target.value })} />
                  {modalErrors.overallDetail && <p className="text-red-400 text-xs">{modalErrors.overallDetail}</p>}
                </div>
                <button type="submit" disabled={isSubmittingReview}
                  className={`w-full flex items-center justify-center gap-2.5 py-5 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg ${isSubmittingReview ? "bg-zinc-700 text-zinc-400 cursor-not-allowed" : "bg-[#f5c27a] hover:bg-[#e0af6b] text-black hover:scale-[1.01]"}`}>
                  {isSubmittingReview ? <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Submitting...</> : <><Star size={16} className="fill-black" aria-hidden="true" /> Submit Review</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default Contact;