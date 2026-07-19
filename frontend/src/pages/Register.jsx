import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import API from "../api/axiosConfig"; 

const Register = () => {
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    password: "",
    phone: "",      
    address: ""     
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const fieldKeys = useMemo(() => ({
    name: `n_${Math.random().toString(36).substring(7)}`,
    email: `e_${Math.random().toString(36).substring(7)}`,
    phone: `p_${Math.random().toString(36).substring(7)}`,
    address: `a_${Math.random().toString(36).substring(7)}`,
    pass: `pw_${Math.random().toString(36).substring(7)}`
  }), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await API.post("/otp/send-otp", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      navigate("/verify-otp", {
        state: {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-6 pt-28">
      <form 
        onSubmit={handleSubmit} 
        className="w-full max-w-2xl rounded-xl bg-black p-8 shadow-2xl border border-gray-800"
        autoComplete="off"
      >
        <input style={{ display: 'none' }} type="text" name="prevent_autofill_user" />
        <input style={{ display: 'none' }} type="password" name="prevent_autofill_pass" />

        <h2 className="mb-2 text-center text-3xl font-bold text-white">Join Us</h2>
        <p className="mb-6 text-center text-sm text-gray-500">
          An OTP will be sent to your email for verification
        </p>
        
        {error && (
          <div className="mb-4 rounded-md border border-red-900 bg-red-900/20 p-3 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="reg-name" className="mb-1 block text-sm font-semibold text-gray-400">Full Name</label>
            <input
              id="reg-name"
              name={fieldKeys.name}
              type="text"
              placeholder="e.g. Arjun Sharma"
              className="w-full rounded-lg border border-gray-700 bg-black p-3 text-white placeholder-gray-600 outline-none focus:border-[#f5c27a]"
              required
              autoComplete="one-time-code"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="mb-1 block text-sm font-semibold text-gray-400">Email Address</label>
            <input
              id="reg-email"
              name={fieldKeys.email}
              type="email"
              placeholder="e.g. arjun@gmail.com"
              className="w-full rounded-lg border border-gray-700 bg-black p-3 text-white placeholder-gray-600 outline-none focus:border-[#f5c27a]"
              required
              autoComplete="new-password"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="reg-phone" className="mb-1 block text-sm font-semibold text-gray-400">Phone Number</label>
            <input
              id="reg-phone"
              name={fieldKeys.phone}
              type="tel"
              placeholder="e.g. +91 98765 43210"
              className="w-full rounded-lg border border-gray-700 bg-black p-3 text-white placeholder-gray-600 outline-none focus:border-[#f5c27a]"
              required
              autoComplete="new-password"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="reg-address" className="mb-1 block text-sm font-semibold text-gray-400">Residential Address</label>
            <textarea
              id="reg-address"
              name={fieldKeys.address}
              rows="2"
              placeholder="e.g. 12, MG Road, Koramangala, Bengaluru – 560034"
              className="w-full rounded-lg border border-gray-700 bg-black p-3 text-white placeholder-gray-600 outline-none focus:border-[#f5c27a]"
              required
              autoComplete="new-password"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="reg-password" className="mb-1 block text-sm font-semibold text-gray-400">Password</label>
            <div className="relative">
              <input
                id="reg-password"
                name={fieldKeys.pass}
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                className="w-full rounded-lg border border-gray-700 bg-black p-3 pr-12 text-white placeholder-gray-600 outline-none focus:border-[#f5c27a]"
                required
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-500 hover:text-[#f5c27a] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="mt-8 w-full rounded-lg bg-[#f5c27a] py-3 text-lg font-bold text-black hover:bg-[#e0b06b] transition-all disabled:opacity-50"
        >
          {isLoading ? "Sending OTP..." : "Send OTP & Continue"}
        </button>

        <p className="mt-4 mb-4 text-center text-sm text-gray-500">
          Already have an account? <Link to="/login" className="font-bold text-[#f5c27a] hover:underline">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;