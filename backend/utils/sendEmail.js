const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: `"Southern Tales" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your OTP Verification Code – Southern Tales",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; color: #f1f1f1; border-radius: 16px; overflow: hidden;">
        
        <div style="background: #111111; padding: 32px 40px; border-bottom: 1px solid #1f1f1f; text-align: center;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #f1f1f1;">
            SOUTHERN TALES
          </h1>
          <p style="margin: 4px 0 0; font-size: 10px; font-weight: 700; letter-spacing: 4px; color: #f5c27a; text-transform: uppercase;">
            Management Suite
          </p>
        </div>

        <div style="padding: 40px;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #aaa;">Hello,</p>
          <p style="margin: 0 0 32px; font-size: 15px; color: #f1f1f1; line-height: 1.6;">
            Use the OTP below to verify your email and complete your registration.
          </p>

          <div style="background: rgba(245,194,122,0.08); border: 1px solid rgba(245,194,122,0.3); border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 32px;">
            <p style="margin: 0 0 8px; font-size: 10px; font-weight: 700; letter-spacing: 3px; color: #aaa; text-transform: uppercase;">
              Your OTP Code
            </p>
            <p style="margin: 0; font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #f5c27a;">
              ${otp}
            </p>
          </div>

          <div style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: 14px 18px; margin-bottom: 32px;">
            <p style="margin: 0; font-size: 12px; color: #f87171;">
              ⏱ This OTP expires in <strong>5 minutes</strong>. Do not share it with anyone.
            </p>
          </div>

          <p style="margin: 0; font-size: 12px; color: #555; line-height: 1.6;">
            If you did not request this, please ignore this email. Your account will not be created.
          </p>
        </div>

        <div style="padding: 20px 40px; border-top: 1px solid #1f1f1f; text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #333;">
            © ${new Date().getFullYear()} Southern Tales. All rights reserved.
          </p>
        </div>

      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };