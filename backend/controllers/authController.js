import { registerUser, authenticateUser, createSessionTokens, refreshSession, revokeRefreshToken, completeUserOnboarding, changePassword, deleteAccount, listSessions } from '../services/authService.js';
import { requireFields } from '../utils/validation.js';

export async function register(req, res, next) {
  try {
    requireFields(req.body, ['email', 'password', 'profile']);
    requireFields(req.body.profile, ['name', 'handle']);
    await registerUser(req.body);
    res.status(201).json({ message: 'Account created. Please sign in.' });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    requireFields(req.body, ['email', 'password']);
    const user = await authenticateUser(req.body.email, req.body.password);
    const tokens = await createSessionTokens(user, req.body.deviceInfo);
    res.status(200).json({
      user: { id: user._id, email: user.email, profile: user.profile, onboardingComplete: user.onboardingComplete, settings: user.settings },
      tokens,
    });
  } catch (error) {
    next(error);
  }
}

export async function completeOnboarding(req, res, next) {
  try {
    const { bio, avatarUrl, privacyMode, allowUnknownMessages } = req.body;
    const user = await completeUserOnboarding(req.user.id, { bio, avatarUrl, privacyMode, allowUnknownMessages });
    res.status(200).json({
      user: { id: user._id, email: user.email, profile: user.profile, onboardingComplete: user.onboardingComplete, settings: user.settings },
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      const error = new Error('Refresh token required');
      error.status = 400;
      throw error;
    }
    const result = await refreshSession(refreshToken);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    if (!req.user) {
      const error = new Error('User not authenticated');
      error.status = 401;
      throw error;
    }
    const sessionId = req.tokenPayload?.sessionId;
    if (sessionId) {
      await revokeRefreshToken(req.user.id, sessionId);
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function changePasswordHandler(req, res, next) {
  try {
    requireFields(req.body, ['currentPassword', 'newPassword']);
    await changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
}

export async function deleteAccountHandler(req, res, next) {
  try {
    await deleteAccount(req.user.id);
    res.status(200).json({ message: 'Account deleted permanently' });
  } catch (error) {
    next(error);
  }
}

export async function listSessionsHandler(req, res, next) {
  try {
    const sessions = await listSessions(req.user.id);
    res.status(200).json({ sessions });
  } catch (error) {
    next(error);
  }
}

export async function revokeSessionHandler(req, res, next) {
  try {
    await revokeRefreshToken(req.user.id, req.params.sessionId);
    res.status(200).json({ message: 'Session revoked' });
  } catch (error) {
    next(error);
  }
}
