const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const { searchUsers, updateProfile, updateAvatar, adminGetUsers, toggleUserStatus, getAuditLogs } = require("../controllers/Usercontroller");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../public/uploads"));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.use(protect);
router.get("/", searchUsers);
router.put("/profile", updateProfile);
router.put("/profile/avatar", upload.single("avatar"), updateAvatar);

// Admin-only user management routes
router.get("/admin/list", requireRole("Admin"), adminGetUsers);
router.get("/admin/audit-logs", requireRole("Admin"), getAuditLogs);
router.put("/:id/status", requireRole("Admin"), toggleUserStatus);

module.exports = router;