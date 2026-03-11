import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getGroups,
  createGroup,
  getGroup,
  joinGroup,
  leaveGroup,
  getMyGroups,
  updateGroup,
  getGroupMessages,
} from '../controllers/groups.controller';

const router = Router();

router.get('/', authenticate, getGroups);
router.post('/', authenticate, createGroup);
router.get('/me', authenticate, getMyGroups);
router.get('/:id', authenticate, getGroup);
router.put('/:id', authenticate, updateGroup);
router.post('/:id/join', authenticate, joinGroup);
router.post('/:id/leave', authenticate, leaveGroup);
router.get('/:id/messages', authenticate, getGroupMessages);

export default router;
