import * as friendService from '../services/friendService.js';
import { requireFields } from '../utils/validation.js';

export async function getFriends(req, res, next) {
  try {
    const friends = await friendService.getFriends(req.user.id);
    res.status(200).json({ friends });
  } catch (error) {
    next(error);
  }
}

export async function getIncomingRequests(req, res, next) {
  try {
    const requests = await friendService.getIncomingRequests(req.user.id);
    res.status(200).json({ requests });
  } catch (error) {
    next(error);
  }
}

export async function getOutgoingRequests(req, res, next) {
  try {
    const requests = await friendService.getOutgoingRequests(req.user.id);
    res.status(200).json({ requests });
  } catch (error) {
    next(error);
  }
}

export async function sendRequest(req, res, next) {
  try {
    requireFields(req.body, ['recipientId']);
    const request = await friendService.sendFriendRequest(req.user.id, req.body.recipientId);

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${req.body.recipientId}`).emit('friendRequestReceived', {
        requestId: request._id,
        senderId: req.user.id,
        senderName: req.user.profile.name,
      });
    }

    res.status(201).json({ request });
  } catch (error) {
    next(error);
  }
}

export async function acceptRequest(req, res, next) {
  try {
    const request = await friendService.acceptFriendRequest(req.params.requestId, req.user.id);

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${request.sender}`).emit('friendRequestAccepted', {
        requestId: request._id,
        accepterId: req.user.id,
      });
    }

    res.status(200).json({ request });
  } catch (error) {
    next(error);
  }
}

export async function rejectRequest(req, res, next) {
  try {
    const request = await friendService.rejectFriendRequest(req.params.requestId, req.user.id);

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${request.sender}`).emit('friendRequestRejected', {
        requestId: request._id,
        rejecterId: req.user.id,
      });
    }

    res.status(200).json({ request });
  } catch (error) {
    next(error);
  }
}

export async function removeFriendHandler(req, res, next) {
  try {
    await friendService.removeFriend(req.user.id, req.params.friendId);
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
}
