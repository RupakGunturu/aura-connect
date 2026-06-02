import { getUserProfile, updateUserProfile, updateUserSettings, searchUsers, findUserByHandle, blockUser, unblockUser, listBlockedUsers, updateUserPublicKey, getUserPublicKey } from '../services/userService.js';
import { requireFields } from '../utils/validation.js';

export async function getProfile(req, res, next) {
  try {
    const profile = await getUserProfile(req.user.id);
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    requireFields(req.body, ['profile']);
    const profile = await updateUserProfile(req.user.id, req.body.profile);
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
}

export async function updatePublicKey(req, res, next) {
  try {
    const { publicKey } = req.body;
    if (!publicKey || typeof publicKey !== 'string') {
      return res.status(400).json({ error: 'publicKey is required' });
    }
    const user = await updateUserPublicKey(req.user.id, publicKey);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

export async function getPublicKey(req, res, next) {
  try {
    const { userId } = req.params;
    const publicKey = await getUserPublicKey(userId);
    res.status(200).json({ publicKey });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    requireFields(req.body, ['settings']);
    const profile = await updateUserSettings(req.user.id, req.body.settings);
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
}

export async function getUserByHandle(req, res, next) {
  try {
    const user = await findUserByHandle(req.params.handle);
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

export async function queryUsers(req, res, next) {
  try {
    const { q } = req.query;
    if (!q) {
      const error = new Error('Search query required');
      error.status = 400;
      throw error;
    }
    const users = await searchUsers(q, req.user.id);
    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
}

export async function blockUserHandler(req, res, next) {
  try {
    const profile = await blockUser(req.user.id, req.params.userId);
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
}

export async function unblockUserHandler(req, res, next) {
  try {
    const profile = await unblockUser(req.user.id, req.params.userId);
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
}

export async function listBlockedUsersHandler(req, res, next) {
  try {
    const users = await listBlockedUsers(req.user.id);
    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
}
