import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true },
  handle: { type: String, trim: true, lowercase: true, unique: true, required: true },
  bio: { type: String, trim: true, default: '' },
  avatarUrl: { type: String, trim: true, default: '' },
});

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  refreshToken: { type: String, required: true },
  deviceInfo: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    profile: { type: profileSchema, required: true },
    onboardingComplete: { type: Boolean, default: false },
    settings: {
      privacyMode: { type: String, enum: ['public', 'friends', 'private'], default: 'private' },
      allowUnknownMessages: { type: Boolean, default: false },
      allowVoiceCalls: { type: Boolean, default: true },
      allowVideoCalls: { type: Boolean, default: true },
      showOnlineStatus: { type: Boolean, default: true },
    },
    sessions: { type: [sessionSchema], default: [] },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

export const User = mongoose.model('User', userSchema);
