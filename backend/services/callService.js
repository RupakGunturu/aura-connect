import { CallSession } from '../models/CallSession.js';

export async function createCallSession(participants, conversationId) {
  const session = new CallSession({ participants, conversationId, status: 'pending' });
  return session.save();
}

export async function getCallSession(sessionId) {
  return CallSession.findById(sessionId).lean();
}

export async function updateCallSession(sessionId, update) {
  return CallSession.findByIdAndUpdate(sessionId, update, { new: true }).lean();
}

export async function closeCallSession(sessionId) {
  return CallSession.findByIdAndUpdate(sessionId, { status: 'ended' }, { new: true }).lean();
}

export async function listUserCallSessions(userId) {
  return CallSession.find({ participants: userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('participants', 'email profile')
    .lean();
}
