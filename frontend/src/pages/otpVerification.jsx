import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import API from "../api/axiosConfig";

const OTPVerification = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(300); // FIX: 5 minutes
  const [timerExpired, setTimerExpired] = useState(false);

  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  const { name, email, password, phone, address } = location.state || {};

  useEffect(() => {
    if (!email) navigate("/register");
  }, [email, navigate]);

  useEffect(() => {
    if (timer <= 0) {
      setTimerExpired(true);
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    setError("");
    setIsVerifying(true);

    try {
      await API.post("/otp/verify-otp", {
        email, otp: otpString, name, password, phone, address,
      });

      setSuccess("Email verified! Account created successfully.");
      setTimeout(() => {
        navigate("/login", {
          state: { message: "Registration successful! Please login." },
        });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setIsResending(true);

    try {
      await API.post("/otp/resend-otp", { email });
      setSuccess("New OTP sent to your email!");
      setTimer(300); // FIX: Reset to 5 minutes
      setTimerExpired(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-6">
      <div className="w-full max-w-md rounded-xl bg-black p-8 shadow-2xl border border-gray-800">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-400/10 border border-yellow-400/30 mb-4">
            <span className="text-2xl">✉️</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Verify Email</h2>
          <p className="text-sm text-gray-500">We sent a 6-digit OTP to</p>
          <p className="text-sm font-bold text-yellow-400 mt-1">{email}</p>
        </div>

        {error && (
          <div className="mb-5 rounded-md border border-red-900 bg-red-900/20 p-3 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-md border border-green-900 bg-green-900/20 p-3 text-center text-sm text-green-400">
            {success}
          </div>
        )}

        <form onSubmit={handleVerify}>
          {/* OTP Input Boxes */}
          <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-14 text-center text-xl font-black rounded-xl border bg-black text-white outline-none transition-all ${
                  digit
                    ? "border-yellow-400 text-yellow-400"
                    : "border-gray-700 focus:border-yellow-400"
                }`}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="text-center mb-6">
            {!timerExpired ? (
              <p className="text-sm text-gray-500">
                OTP expires in{" "}
                <span className={`font-bold ${timer < 60 ? "text-red-400" : "text-yellow-400"}`}>
                  {formatTime(timer)}
                </span>
              </p>
            ) : (
              <p className="text-sm text-red-400 font-bold">OTP has expired</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isVerifying || timerExpired || otp.join("").length !== 6}
            className="w-full rounded-lg bg-yellow-400 py-3 text-lg font-bold text-black hover:bg-yellow-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        {/* Resend */}
        <div className="mt-5 text-center">
          <p className="text-sm text-gray-500">
            Didn't receive the OTP?{" "}
            <button
              onClick={handleResend}
              disabled={isResending || (!timerExpired && timer > 240)} // FIX: resend after 1 min (300-60=240)
              className="font-bold text-yellow-400 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isResending ? "Sending..." : "Resend OTP"}
            </button>
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {!timerExpired && timer > 240
              ? `Resend available in ${formatTime(timer - 240)}`
              : ""}
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/register" className="text-sm text-gray-600 hover:text-gray-400 transition-colors">
            ← Back to Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;