const Admin = require("../models/Admin");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

// ✅ Get admin info
exports.getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOne().select("-password"); // exclude password
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    res.json({
      success: true,
      message: "Admin data fetched successfully",
      admin: {
        ...admin.toObject(),
        profilePic: admin.profilePic
          ? `${process.env.SERVER_URL || "http://localhost:5000"}${admin.profilePic}`
          : "", // ✅ full URL or empty
      },
    });
  } catch (err) {
    console.error("Error in getAdmin:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Verify password
exports.verifyPassword = async (req, res) => {
  const { password } = req.body;
  try {
    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Wrong password" });
    }

    res.json({ success: true, message: "Password correct" });
  } catch (err) {
    console.error("Error verifying password:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Update admin info (with Profile Picture replacement)
exports.updateAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const updateFields = {};
    const { name, uId, email, designation, area } = req.body;

    if (name) updateFields.name = name;
    if (uId) updateFields.uId = uId;
    if (designation) updateFields.designation = designation;
    if (area) updateFields.area = area;

    // ✅ Email uniqueness check
    if (email && email !== admin.email) {
      const existing = await Admin.findOne({ email });
      if (existing) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      }
      updateFields.email = email;
    }

    // ✅ Handle profile picture upload
    if (req.file) {
      const newPath = `/uploads/${req.file.filename}`;

      // Delete old profilePic if exists and is safe
      if (admin.profilePic && admin.profilePic.startsWith("/uploads/")) {
        const oldPath = path.resolve(__dirname, "..", admin.profilePic);
        fs.unlink(oldPath, (err) => {
          if (err && err.code !== "ENOENT") {
            console.error("⚠️ Failed to delete old profilePic:", err.message);
          }
        });
      }

      updateFields.profilePic = newPath;
    }

    // ✅ Update DB
    const updatedAdmin = await Admin.findByIdAndUpdate(
      admin._id,
      { $set: updateFields },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Admin updated successfully",
      admin: {
        ...updatedAdmin.toObject(),
        profilePic: updatedAdmin.profilePic
          ? `${process.env.SERVER_URL || "http://localhost:5000"}${updatedAdmin.profilePic}`
          : "",
      },
    });
  } catch (err) {
    console.error("Error updating admin:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Change password
exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Wrong password" });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Error changing password:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
