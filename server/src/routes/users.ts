import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload, uploadVideo } from '../middleware/upload';
import {
  getUserProfile,
  updateProfile,
  updateAvatar,
  updateVideoIntro,
  getNearbyUsers,
  getUserPosts,
  getUserExchanges,
} from '../controllers/users.controller';

const router = Router();

router.get('/nearby', authenticate, getNearbyUsers);
// /me routes must come before /:id so "me" is not treated as a MongoDB ID
router.put('/me', authenticate, updateProfile);
router.put('/me/avatar', authenticate, upload.single('avatar'), updateAvatar);
router.put('/me/video-intro', authenticate, uploadVideo.single('video'), updateVideoIntro);
router.get('/:id', authenticate, getUserProfile);
router.get('/:id/posts', authenticate, getUserPosts);
router.get('/:id/exchanges', authenticate, getUserExchanges);

export default router;
