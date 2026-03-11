import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { getTags, getFeed, createPost, getPost, votePost, deletePost } from '../controllers/posts.controller';

const router = Router();

router.get('/tags', getTags); // public — no auth needed
router.get('/', optionalAuthenticate, getFeed);
router.post('/', authenticate, createPost);
router.get('/:id', optionalAuthenticate, getPost);
router.put('/:id/vote', authenticate, votePost);
router.delete('/:id', authenticate, deletePost);

export default router;
