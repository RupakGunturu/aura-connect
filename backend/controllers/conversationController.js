import { createConversation, getConversationById, getUserConversations, addParticipant, removeParticipant, pinMessage, unpinMessage, setDisappearDuration } from '../services/conversationService.js';
import { markConversationRead } from '../services/messageService.js';
import { clearConversationHistory } from '../services/conversationService.js';
import { requireFields } from '../utils/validation.js';

export async function listConversations(req, res, next) {
  try {
    const conversations = await getUserConversations(req.user.id);
    res.status(200).json({ conversations });
  } catch (error) {
    next(error);
  }
}

export async function getConversation(req, res, next) {
  try {
    const conversation = await getConversationById(req.params.conversationId);
    if (!conversation) {
      const error = new Error('Conversation not found');
      error.status = 404;
      throw error;
    }
    res.status(200).json({ conversation });
  } catch (error) {
    next(error);
  }
}

export async function createNewConversation(req, res, next) {
  try {
    requireFields(req.body, ['participants']);
    const conversation = await createConversation(req.body.participants, req.body.title, req.body.isPrivate);
    res.status(201).json({ conversation });
  } catch (error) {
    next(error);
  }
}

export async function joinConversation(req, res, next) {
  try {
    requireFields(req.body, ['participantId']);
    const conversation = await addParticipant(req.params.conversationId, req.body.participantId);
    res.status(200).json({ conversation });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req, res, next) {
  try {
    await markConversationRead(req.params.conversationId, req.user.id);
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function pinMessageHandler(req, res, next) {
  try {
    const conversation = await pinMessage(req.params.conversationId, req.params.messageId, req.user.id);
    if (!conversation) {
      const error = new Error('Conversation not found');
      error.status = 404;
      throw error;
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${req.params.conversationId}`).emit('messagePinned', {
        conversationId: req.params.conversationId,
        messageId: req.params.messageId,
        pinnedBy: req.user.id,
      });
    }

    res.status(200).json({ conversation });
  } catch (error) {
    next(error);
  }
}

export async function unpinMessageHandler(req, res, next) {
  try {
    const conversation = await unpinMessage(req.params.conversationId, req.params.messageId);
    if (!conversation) {
      const error = new Error('Conversation not found');
      error.status = 404;
      throw error;
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${req.params.conversationId}`).emit('messageUnpinned', {
        conversationId: req.params.conversationId,
        messageId: req.params.messageId,
      });
    }

    res.status(200).json({ conversation });
  } catch (error) {
    next(error);
  }
}

export async function setDisappearDurationHandler(req, res, next) {
  try {
    const { duration } = req.body;
    if (typeof duration !== 'number' || duration < 0) {
      const error = new Error('Invalid duration');
      error.status = 400;
      throw error;
    }
    const conversation = await setDisappearDuration(req.params.conversationId, duration);
    if (!conversation) {
      const error = new Error('Conversation not found');
      error.status = 404;
      throw error;
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${req.params.conversationId}`).emit('disappearDurationChanged', {
        conversationId: req.params.conversationId,
        duration,
      });
    }

    res.status(200).json({ conversation });
  } catch (error) {
    next(error);
  }
}

export async function clearHistory(req, res, next) {
  try {
    await clearConversationHistory(req.params.conversationId, req.user.id);
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function leaveConversation(req, res, next) {
  try {
    requireFields(req.body, ['participantId']);
    const conversation = await removeParticipant(req.params.conversationId, req.body.participantId);
    res.status(200).json({ conversation });
  } catch (error) {
    next(error);
  }
}
