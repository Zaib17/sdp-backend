const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const { getAdmin, updateAdmin, verifyPassword, changePassword } = require("../controllers/adminController");

// ✅ GET admin profile
router.get("/admin", authMiddleware, getAdmin);

// ✅ Verify password
router.post("/admin/verify-password", authMiddleware, verifyPassword);

// ✅ Update admin info (with file upload)
router.put("/admin", authMiddleware, upload.single("profilePic"), updateAdmin);

// ✅ Change password
router.put("/admin/change-password", authMiddleware, changePassword);

module.exports = router;
