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
    requireFields(req.body, ['conversationId', 'encryptedPayload', 'iv', 'authTag']);
    const message = await createMessage({
      conversationId: req.body.conversationId,
      senderId: req.user.id,
      encryptedPayload: req.body.encryptedPayload,
      iv: req.body.iv,
      authTag: req.body.authTag,
      metadata: req.body.metadata || {},
    });
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
