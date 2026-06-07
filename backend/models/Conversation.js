import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    isPrivate: { type: Boolean, default: true },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    unreadCounts: { type: Map, of: Number, default: {} },
    disappearDuration: { type: Number, default: 0 },
    clearedHistoryAt: { type: Map, of: Date, default: {} },
    pinned: [{
      messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
      pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      pinnedAt: { type: Date, default: Date.now },
    }],
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ participants: 1, updatedAt: -1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
