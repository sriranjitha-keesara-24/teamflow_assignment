const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const { uploadTaskAttachment, uploadRCAAttachment, deleteAttachment, getTaskAttachments, getRCAAttachments } = require('../controllers/atachmentController');


// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.use(protect);

// Task attachments
router.route('/tasks/:taskId/attachments')
    .get(getTaskAttachments)
    .post(upload.single('file'), uploadTaskAttachment);

// RCA attachments
router.route('/rca/:rcaId/attachments')
    .get(getRCAAttachments)
    .post(upload.single('file'), uploadRCAAttachment);

// Delete attachment
router.route('/attachments/:id')
    .delete(deleteAttachment);

module.exports = router;
