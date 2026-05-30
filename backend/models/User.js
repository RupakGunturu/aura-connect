import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true },
  handle: { type: String, trim: true, lowercase: true, unique: true, required: true },
  bio: { type: String, trim: true, default: '' },
  avatarUrl: { type: String, trim: true, default: '' },
});

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    profile: { type: profileSchema, required: true },
    refreshToken: { type: String, default: null },
    settings: {
      privacyMode: { type: String, enum: ['public', 'friends', 'private'], default: 'private' },
      allowUnknownMessages: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

export const User = mongoose.model('User', userSchema);
