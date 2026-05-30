import mongoose from 'mongoose';

const callSessionSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    status: { type: String, enum: ['pending', 'active', 'ended'], default: 'pending' },
    signalingData: { type: mongoose.Schema.Types.Mixed, default: {} },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const CallSession = mongoose.model('CallSession', callSessionSchema);
