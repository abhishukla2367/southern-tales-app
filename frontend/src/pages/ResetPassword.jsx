import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [message, setMessage]       = useState("");
  const [error, setError]           = useState("");
  const [showPwd, setShowPwd]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // STRICT AUTOCOMPLETE KILL: Random field names on every mount
  const pwdKey     = useMemo(() => `pwd_${Math.random().toString(36).substring(7)}`, []);
  const confirmKey = useMemo(() => `cpwd_${Math.random().toString(36).substring(7)}`, []);

  // readOnly until focus — prevents browser from ever injecting saved values
  const [pwdReady,     setPwdReady]     = useState(true);
  const [confirmReady, setConfirmReady] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords do not match.");
    try {
      const res = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setError("");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Server error. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-6">
      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a1a] p-10 shadow-2xl"
      >
        {/* HONEYPOT */}
        <input style={{ display: "none" }} type="password" name="prevent_autofill" />

        <h2 className="mb-3 text-center text-3xl font-extrabold text-white">New Password</h2>
        <p className="mb-8 text-center text-sm text-gray-400">
          Enter and confirm your new password below.
        </p>

        {message && (
          <div className="mb-6 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-center text-sm font-bold text-green-400">
            ✅ {message} Redirecting to login...
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-center text-sm font-bold text-red-400">
            ❌ {error}
          </div>
        )}

        {/* New Password */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-bold text-gray-300">New Password</label>
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              name={pwdKey}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPwdReady(false)}
              readOnly={pwdReady}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              required
              className="w-full rounded-xl border border-white/10 bg-[#252525] p-4 pr-12 text-white outline-none transition-all focus:border-[#f5c27a] focus:ring-1 focus:ring-[#f5c27a]"
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-[#f5c27a] focus:outline-none"
              tabIndex={-1}
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-bold text-gray-300">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              name={confirmKey}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onFocus={() => setConfirmReady(false)}
              readOnly={confirmReady}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              required
              className="w-full rounded-xl border border-white/10 bg-[#252525] p-4 pr-12 text-white outline-none transition-all focus:border-[#f5c27a] focus:ring-1 focus:ring-[#f5c27a]"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-[#f5c27a] focus:outline-none"
              tabIndex={-1}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-[#f5c27a] py-4 text-sm font-black uppercase tracking-widest text-black shadow-lg transition-all hover:bg-[#eab366] hover:scale-[1.01] active:scale-[0.98]"
        >
          Reset Password
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;