import { createConversation, getConversationById, getUserConversations, addParticipant, removeParticipant } from '../services/conversationService.js';
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

export async function leaveConversation(req, res, next) {
  try {
    requireFields(req.body, ['participantId']);
    const conversation = await removeParticipant(req.params.conversationId, req.body.participantId);
    res.status(200).json({ conversation });
  } catch (error) {
    next(error);
  }
}
