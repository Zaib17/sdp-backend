const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

let codeStorage = {}; // { email: { code: '123456', expiresAt: timestamp } }

exports.sendVerificationCode = async (req, res) => {
  const { email } = req.body;

  const admin = await Admin.findOne({ email });
  if (!admin) return res.json({ success: false, message: "Enter a registered email." });

  // Generate code and expiry
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 59000; // 59 seconds

  codeStorage[email] = { code, expiresAt };

  // Send email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '🔐 Password Reset Verification – IoT Power Monitoring',
    text: `Dear Admin,

You have requested to reset your password for the IoT Smart Power Monitoring system.
Please use the verification code below to proceed:

🔢 Verification Code: ${code}

This code is valid for 59 seconds. If you didn’t request this, please ignore this email.

Regards,
IoT Power Monitoring System Team`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      return res.json({ success: false, message: "Error sending email." });
    }
    return res.json({ success: true, message: "Verification code sent." });
  });
};

exports.verifyCode = (req, res) => {
  const { email, code } = req.body;
  const record = codeStorage[email];

  if (!record || record.code !== code || Date.now() > record.expiresAt) {
    return res.json({ success: false, message: "Invalid or expired code." });
  }

  return res.json({ success: true, message: "Code verified." });
};

exports.resetPassword = async (req, res) => {
  const { email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);
  await Admin.updateOne({ email }, { $set: { password: hashed } });

  delete codeStorage[email]; // clean up

  res.json({ success: true, message: "Password successfully updated." });
};
