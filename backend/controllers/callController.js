import { createCallSession, getCallSession, updateCallSession, closeCallSession, listUserCallSessions } from '../services/callService.js';
import { requireFields } from '../utils/validation.js';

export async function createCall(req, res, next) {
  try {
    requireFields(req.body, ['participants']);
    const session = await createCallSession(req.body.participants, req.body.conversationId);
    res.status(201).json({ session });
  } catch (error) {
    next(error);
  }
}

export async function getCall(req, res, next) {
  try {
    const session = await getCallSession(req.params.callId);
    if (!session) {
      const error = new Error('Call session not found');
      error.status = 404;
      throw error;
    }
    res.status(200).json({ session });
  } catch (error) {
    next(error);
  }
}

export async function updateCall(req, res, next) {
  try {
    const update = req.body;
    const session = await updateCallSession(req.params.callId, update);
    res.status(200).json({ session });
  } catch (error) {
    next(error);
  }
}

export async function listCalls(req, res, next) {
  try {
    const sessions = await listUserCallSessions(req.user.id);
    res.status(200).json({ sessions });
  } catch (error) {
    next(error);
  }
}

export async function endCall(req, res, next) {
  try {
    const status = req.body?.status || 'ended';
    const session = await closeCallSession(req.params.callId, status);
    res.status(200).json({ session });
  } catch (error) {
    next(error);
  }
}
