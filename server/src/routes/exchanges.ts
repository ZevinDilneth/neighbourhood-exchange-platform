import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getExchanges,
  createExchange,
  getExchange,
  respondToExchange,
  updateExchangeStatus,
  sendExchangeMessage,
  getMyExchanges,
} from '../controllers/exchanges.controller';

const router = Router();

router.get('/', authenticate, getExchanges);
router.post('/', authenticate, createExchange);
router.get('/me', authenticate, getMyExchanges);
router.get('/:id', authenticate, getExchange);
router.post('/:id/respond', authenticate, respondToExchange);
router.put('/:id/status', authenticate, updateExchangeStatus);
router.post('/:id/messages', authenticate, sendExchangeMessage);

export default router;
