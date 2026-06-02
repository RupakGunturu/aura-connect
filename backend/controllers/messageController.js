import { createMessage, getConversationMessages, markMessageDelivered, markMessageRead, softDeleteMessage } from '../services/messageService.js';
import { requireFields } from '../utils/validation.js';

export async function listMessages(req, res, next) {
  try {
    const { before } = req.query;
    const result = await getConversationMessages(req.params.conversationId, Number(req.query.limit) || 50, req.user.id, before);
    res.status(200).json(result);
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
    if (req.body.replyTo) payload.replyTo = req.body.replyTo;
    if (req.body.forwardedFrom) payload.forwardedFrom = req.body.forwardedFrom;
    if (req.body.encryptedPayload) {
      payload.encryptedPayload = req.body.encryptedPayload;
      payload.iv = req.body.iv;
      payload.authTag = req.body.authTag;
    }
    if (req.body.attachments) payload.attachments = req.body.attachments;
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

export async function deleteMessage(req, res, next) {
  try {
    const message = await softDeleteMessage(req.params.messageId, req.user.id);
    if (!message) {
      const error = new Error('Message not found');
      error.status = 404;
      throw error;
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${message.conversationId}`).emit('messageDeleted', {
        messageId: message._id,
        conversationId: message.conversationId,
      });
    }

    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
}
