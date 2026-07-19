export default function SkeletonCard() {
  return (
    <div
      className="p-4 rounded-xl animate-pulse"
      style={{ background: "#111111", border: "1px solid #1f1f1f" }}
    >
      <div className="h-3 w-24 rounded mb-3" style={{ background: "#1f1f1f" }} />
      <div className="h-6 w-16 rounded" style={{ background: "#2a2a2a" }} />
    </div>
  );
}