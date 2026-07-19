import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);

  // STRICT AUTOCOMPLETE KILL: Unique field name on every mount
  const fieldKey = useMemo(() => `reset_em_${Math.random().toString(36).substring(7)}`, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsSent(true);
        setEmail("");
      } else {
        alert(data.message || "Something went wrong.");
      }
    } catch (err) {
      alert("Server error. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-6">
      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a1a] p-10 shadow-2xl"
      >
        {/* HONEYPOT: Prevents browser from trying to autofill saved logins here */}
        <input style={{ display: 'none' }} type="text" name="prevent_autofill" />

        <h2 className="mb-3 text-center text-3xl font-extrabold text-white">Reset Password</h2>

        <p className="mb-8 text-center text-sm font-medium text-gray-400 leading-relaxed">
          Enter your registered email address and we'll send a secure link to reset your password.
        </p>

        {isSent && (
          <div className="mb-6 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-center text-sm font-bold text-green-400">
            ✅ Reset link has been sent to your email!
          </div>
        )}

        <div className="mb-6">
          <label className="mb-2 block text-sm font-bold text-gray-300">Email Address</label>
          <input
            type="email"
            name={fieldKey}
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            // STRICT: Kill autocomplete
            autoComplete="new-password"
            className="w-full rounded-xl border border-white/10 bg-[#252525] p-4 text-white outline-none transition-all focus:border-[#f5c27a] focus:ring-1 focus:ring-[#f5c27a]"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-[#f5c27a] py-4 text-sm font-black uppercase tracking-widest text-black shadow-lg transition-all hover:bg-[#eab366] hover:scale-[1.01] active:scale-[0.98]"
        >
          Send Reset Link
        </button>

        <div className="mt-8 text-center text-sm">
          <Link 
            to="/login" 
            className="font-bold text-[#f5c27a] hover:underline transition-colors"
          >
            &larr; Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;