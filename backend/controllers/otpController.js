const OTP = require("../models/OTP");
const User = require("../models/User");
const { sendOTPEmail } = require("../utils/sendEmail");

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.sendOTP = async (req, res) => {
  const { email, name, password } = req.body;

  try {
    if (!email || !name || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered. Please login.",
      });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // FIX: 5 minutes

    await OTP.deleteMany({ email });
    await OTP.create({ email, otp, expiresAt });
    await sendOTPEmail(email, otp);

    console.log(`✅ OTP sent to ${email}`);

    res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${email}`,
    });
  } catch (err) {
    console.error("❌ Send OTP Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
    });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp, name, password, phone, address } = req.body;

  try {
    if (!email || !otp || !name || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found. Please request a new one.",
      });
    }

    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteMany({ email });
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (otpRecord.otp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    if (otpRecord.verified) {
      return res.status(400).json({
        success: false,
        message: "OTP already used. Please request a new one.",
      });
    }

    otpRecord.verified = true;
    await otpRecord.save();
    await OTP.deleteMany({ email });

    const newUser = await User.create({
      name,
      email,
      password,
      phone: phone || "",
      address: address || "",
      role: "user",
    });

    console.log(`✅ User registered: ${email}`);

    res.status(201).json({
      success: true,
      message: "Email verified successfully! Account created.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error("❌ Verify OTP Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP. Please try again.",
    });
  }
};

exports.resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // FIX: 5 minutes

    await OTP.deleteMany({ email });
    await OTP.create({ email, otp, expiresAt });
    await sendOTPEmail(email, otp);

    console.log(`✅ OTP resent to ${email}`);

    res.status(200).json({
      success: true,
      message: "New OTP sent successfully.",
    });
  } catch (err) {
    console.error("❌ Resend OTP Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to resend OTP.",
    });
  }
};