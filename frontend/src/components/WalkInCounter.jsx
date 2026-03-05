import { useState, useEffect } from "react";
import API from "../api/axiosConfig";

export default function WalkInCounter() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/walkin").then(({ data }) => setCount(data.count));
  }, []);

  const update = async (type) => {
    setLoading(true);
    try {
      const { data } = await API.post(`/walkin/${type}`);
      setCount(data.count);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update count");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl px-6 py-5 flex items-center justify-between">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#555]">
          Walk-in Members Today
        </p>
        <p className="text-4xl font-black text-[#f5c27a] mt-1">{count}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Decrement */}
        <button
          onClick={() => update("decrement")}
          disabled={loading || count === 0}
          aria-label="Decrease walk-in count"
          className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-[#aaa] text-xl font-bold hover:border-red-400/50 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <span aria-hidden="true">−</span>
        </button>

        {/* Increment */}
        <button
          onClick={() => update("increment")}
          disabled={loading}
          aria-label="Increase walk-in count"
          className="w-10 h-10 rounded-xl bg-[#f5c27a]/10 border border-[#f5c27a]/30 text-[#f5c27a] text-xl font-bold hover:bg-[#f5c27a]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
    </div>
  );
}