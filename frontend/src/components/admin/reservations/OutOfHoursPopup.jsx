export default function OutOfHoursPopup({ onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
      <div className="bg-[#111111] border border-zinc-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500" />
        <div className="flex flex-col items-center pt-8 pb-2 px-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-900/30 border border-amber-700/50 flex items-center justify-center mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              className="text-amber-400">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight text-center">Outside Business Hours</h2>
          <p className="text-zinc-400 text-sm text-center mt-2 leading-relaxed">
            Reservations can only be made during our operating hours.
          </p>
        </div>
        <div className="mx-8 mt-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">Operating Hours</p>
          </div>
          <div className="divide-y divide-zinc-800/60">
            <div className="flex items-center justify-between px-5 py-3.5">
              <p className="text-white text-sm font-bold">Monday – Friday</p>
              <p className="text-sky-400 font-mono font-black text-sm">7:00 AM – 10:30 PM</p>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <p className="text-white text-sm font-bold">Saturday – Sunday</p>
              <p className="text-violet-400 font-mono font-black text-sm">8:00 AM – 11:00 PM</p>
            </div>
          </div>
        </div>
        <div className="px-8 py-6">
          <button onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#f5c27a] hover:bg-[#e0a84a] text-black font-black text-sm tracking-wide transition-colors">
            ← Choose a Different Time
          </button>
        </div>
      </div>
    </div>
  );
}