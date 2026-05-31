import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, trim: true },
    encryptedPayload: { type: String },
    iv: { type: String },
    authTag: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    delivered: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = mongoose.model('Message', messageSchema);
