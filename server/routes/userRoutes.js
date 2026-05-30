import express from 'express';
import multer from 'multer';
import path from 'path';
import { requireAuth } from '../middleware/requireAuth.js';
import { updateProfile, uploadImage } from '../controllers/userController.js';

const router = express.Router();

// Multer config for local storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    // Rename file to prevent duplicates
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Protect all routes
router.use(requireAuth);

router.put('/profile', updateProfile);
router.post('/profile/image', upload.single('image'), uploadImage);

export default router;
