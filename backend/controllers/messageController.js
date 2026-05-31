import { createMessage, getConversationMessages, markMessageDelivered, markMessageRead } from '../services/messageService.js';
import { requireFields } from '../utils/validation.js';

export async function listMessages(req, res, next) {
  try {
    const messages = await getConversationMessages(req.params.conversationId, Number(req.query.limit) || 50);
    res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
}

export async function sendMessage(req, res, next) {
  try {
    const payload = {
      conversationId: req.body.conversationId,
      senderId: req.user.id,
      metadata: req.body.metadata || {},
    };
    payload.body = req.body.body || '';
    if (req.body.encryptedPayload) {
      payload.encryptedPayload = req.body.encryptedPayload;
      payload.iv = req.body.iv;
      payload.authTag = req.body.authTag;
    }
    const message = await createMessage(payload);

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${message.conversationId}`).emit('message', message);
    }

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
}

export async function updateDeliveryStatus(req, res, next) {
  try {
    const message = await markMessageDelivered(req.params.messageId);
    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
}

export async function updateReadStatus(req, res, next) {
  try {
    const message = await markMessageRead(req.params.messageId);
    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
}
