import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { User } from '../models/User.js';
import { getVapidPublicKey } from '../services/pushService.js';

const router = express.Router();

router.use(requireAuth);

router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});

router.post('/subscribe', async (req, res, next) => {
  try {
    const { endpoint, keys, deviceInfo } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }
    await User.findByIdAndUpdate(req.user.id, {
      $push: { pushSubscriptions: { endpoint, keys, deviceInfo: deviceInfo || '' } }
    });
    res.status(201).json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/subscribe', async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { pushSubscriptions: { endpoint } }
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
