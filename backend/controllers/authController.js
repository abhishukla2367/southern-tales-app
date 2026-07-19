const User = require("../models/User");
const Order = require("../models/Order");
const Reservation = require("../models/Reservation");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password || !phone || !address) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const normalizedEmail = email.toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    await User.create({
      name,
      email: normalizedEmail,
      password, // Password hashing handled in User Model Middleware
      phone,
      address,
    });

    res.status(201).json({ success: true, message: "Registration successful!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Registration failed", error: err.message });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ FIX: Guard against missing email or password before calling .toLowerCase()
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (user && (await user.matchPassword(password))) {
      const token = jwt.sign(
        { id: user._id, role: user.role || "user", isAdmin: user.role === "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.status(200).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Login server error" });
  }
};

/**
 * @desc    Get user profile with Orders and Reservations
 * @route   GET /api/auth/profile
 * @access  Private
 */
exports.getProfile = async (req, res) => {
  try {
    const currentId = req.user.id;
    // ✅ NOTE: Mongoose handles string-to-ObjectId automatically,
    // but explicit conversion is kept for clarity and safety
    const objectId = new mongoose.Types.ObjectId(currentId);

    const [user, orders, reservations] = await Promise.all([
      User.findById(objectId).select("-password"),
      Order.find({ userId: { $in: [objectId, currentId] } }).sort({ createdAt: -1 }),
      Reservation.find({ userId: objectId }).sort({ date: -1 }),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log(`✅ Profile Sync: ${user.email}`);
    console.log(`📊 Stats -> Orders found: ${orders.length} | Reservations found: ${reservations.length}`);

    res.status(200).json({
      success: true,
      user,
      orders,
      reservations,
    });
  } catch (err) {
    console.error("Profile Fetch Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * @desc    Send password reset link to email
 * @route   POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    // ✅ Guard against missing email
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "No account found with that email." });
    }

    // Generate & hash token — raw token sent to user, hashed version stored in DB
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
    });

    await transporter.sendMail({
      from: `"Southern Tales" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reset Your Password — Southern Tales",
      html: `
        <!DOCTYPE html>
        <html>
          <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 0;">
              <tr>
                <td align="center">
                  <table width="560" cellpadding="0" cellspacing="0"
                    style="background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">

                    <!-- Header -->
                    <tr>
                      <td style="background:#f5c27a;padding:30px 40px;text-align:center;">
                        <h1 style="margin:0;color:#000;font-size:26px;font-weight:900;letter-spacing:2px;">
                          SOUTHERN TALES
                        </h1>
                        <p style="margin:6px 0 0;color:#000;font-size:13px;opacity:0.7;letter-spacing:1px;">
                          Authentic South Indian Flavours
                        </p>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding:40px;">
                        <h2 style="color:#fff;margin:0 0 12px;font-size:22px;">Reset Your Password</h2>
                        <p style="color:#aaa;font-size:15px;line-height:1.7;margin:0 0 24px;">
                          Hi <strong style="color:#fff;">${user.name || "there"}</strong>,<br/>
                          We received a request to reset the password for your Southern Tales account.
                          Click the button below to set a new password. This link expires in
                          <strong style="color:#f5c27a;">1 hour</strong>.
                        </p>

                        <!-- CTA Button -->
                        <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                          <tr>
                            <td style="background:#f5c27a;border-radius:10px;">
                              <a href="${resetURL}"
                                style="display:inline-block;padding:14px 36px;color:#000;font-weight:800;
                                       font-size:14px;text-decoration:none;letter-spacing:1.5px;text-transform:uppercase;">
                                Reset My Password
                              </a>
                            </td>
                          </tr>
                        </table>

                        <p style="color:#666;font-size:13px;line-height:1.6;margin:0 0 8px;">
                          Or copy and paste this link into your browser:
                        </p>
                        <p style="background:#252525;border-radius:8px;padding:12px;
                                  color:#f5c27a;font-size:12px;word-break:break-all;margin:0 0 28px;">
                          ${resetURL}
                        </p>

                        <p style="color:#555;font-size:13px;margin:0;">
                          If you didn't request a password reset, you can safely ignore this email.
                          Your password will remain unchanged.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background:#111;padding:20px 40px;text-align:center;
                                 border-top:1px solid #2a2a2a;">
                        <p style="color:#444;font-size:12px;margin:0;">
                          © ${new Date().getFullYear()} Southern Tales. All rights reserved.
                        </p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    res.status(200).json({ message: "Reset link sent successfully." });
  } catch (err) {
    console.error("❌ Forgot Password Error:", err.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

/**
 * @desc    Validate token & reset password
 * @route   POST /api/auth/reset-password/:token
 */
exports.resetPassword = async (req, res) => {
  try {
    // ✅ Guard against missing password in body
    if (!req.body.password) {
      return res.status(400).json({ message: "New password is required." });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or has expired." });
    }

    user.password = req.body.password; // will be hashed by pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("❌ Reset Password Error:", err.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};