import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, trim: true },
    encryptedPayload: { type: String },
    iv: { type: String },
    authTag: { type: String },
    attachments: [{
      type: { type: String, enum: ['image', 'file'], required: true },
      url: { type: String, required: true },
      name: { type: String, default: '' },
      size: { type: Number, default: 0 },
      encryptedPayload: { type: String },
      fileIv: { type: String },
      fileAuthTag: { type: String },
    }],
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    deletedAt: { type: Date, default: null },
    forwardedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    disappearsAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    delivered: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ disappearsAt: 1 }, { expireAfterSeconds: 0 });

export const Message = mongoose.model('Message', messageSchema);
