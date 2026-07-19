import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import API from "../api/axiosConfig";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState("");
  const [isLoading, setIsLoading]       = useState(false);

  const { login, user } = useContext(AuthContext);
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const res = await API.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });
      const token    = res.data.token || res.data.accessToken;
      const userData = res.data.user;
      if (token && userData) {
        login(userData, token);
        navigate(from, { replace: true });
      } else {
        setError("Login failed: Invalid data from server.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-5">
      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-[#1a1a1a] p-10 shadow-2xl"
      >
        <h2 className="mb-2 text-center text-3xl font-extrabold text-white">Welcome Back</h2>
        <p className="mb-8 text-center text-sm text-gray-400">Login to your account to continue</p>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 p-3 text-center text-sm font-medium text-red-500 border border-red-500/20">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="mb-5">
          <label htmlFor="login-email" className="mb-2 block text-sm font-bold text-gray-300">Email Address</label>
          <input
            id="login-email"
            type="email"
            value={email}
            autoComplete="off"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. arjun@gmail.com"
            className="w-full rounded-xl border border-white/10 bg-[#252525] p-3.5 text-white placeholder-gray-600 outline-none transition-all focus:border-[#f5c27a] focus:ring-1 focus:ring-[#f5c27a]"
            required
          />
        </div>

        {/* Password */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="login-password" className="text-sm font-bold text-gray-300">Password</label>
            <Link
              to="/forgot-password"
              className="text-sm font-bold text-[#f5c27a] hover:underline transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-white/10 bg-[#252525] p-3.5 pr-12 text-white placeholder-gray-600 outline-none transition-all focus:border-[#f5c27a] focus:ring-1 focus:ring-[#f5c27a]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#f5c27a] transition-colors p-1 rounded-lg"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full rounded-xl bg-[#f5c27a] p-4 font-bold text-[#0a0a0a] shadow-lg transition-all ${
            isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-[#eab366] hover:scale-[1.01] active:scale-[0.98]"
          }`}
        >
          {isLoading ? "Authenticating..." : "Login"}
        </button>

        <div className="mt-8 text-center text-sm text-gray-400">
          New here?{" "}
          <Link to="/register" className="font-bold text-[#f5c27a] hover:underline">
            Create an Account
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Login;