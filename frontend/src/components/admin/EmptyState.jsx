export default function EmptyState({
  title = "Nothing here yet",
  message = "No records found.",
  action,
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center py-24 px-6 rounded-2xl text-center"
      style={{
        background: "#111111",
        border: "1px dashed #2a2a2a",
        animation: "fadeIn 0.4s ease",
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
      `}</style>

      {/* Animated icon */}
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{
          background: "rgba(245,194,122,0.06)",
          border: "1px solid rgba(245,194,122,0.15)",
          animation: "float 3s ease-in-out infinite",
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f5c27a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
          <path d="M11 8v6M8 11h6" />
        </svg>
      </div>

      <p className="text-base font-black mb-2 tracking-tight" style={{ color: "#ccc" }}>
        {title}
      </p>
      <p className="text-sm max-w-xs leading-relaxed" style={{ color: "#555" }}>
        {message}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
