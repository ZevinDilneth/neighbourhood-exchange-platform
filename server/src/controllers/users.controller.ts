import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { User } from '../models/User';
import { Post } from '../models/Post';
import { Exchange } from '../models/Exchange';
import { createError } from '../middleware/errorHandler';
import { uploadToS3, resolveAvatarUrl } from '../services/storage';

// ── Helper: attach signed avatar URL to any plain user object ────────────────
// Works with .lean() results (plain objects) and populated sub-docs alike.
const withSignedAvatar = <T extends { avatar?: string | null }>(obj: T): T => ({
  ...obj,
  avatar: resolveAvatarUrl(obj.avatar) ?? obj.avatar,
});

// ─────────────────────────────────────────────────────────────────────────────

export const getUserProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id)
      .populate('groups', 'name avatar memberCount')
      .lean();

    if (!user) return next(createError('User not found', 404));

    res.json(withSignedAvatar(user));
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const updates: Record<string, unknown> = {};

    // Top-level scalar fields
    for (const field of ['name', 'bio', 'skills', 'interests'] as const) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    // Location — use dot-notation $set so Mongoose doesn't replace the whole
    // subdocument (avoids validator issues with required sub-fields like coordinates)
    if (req.body.location && typeof req.body.location === 'object') {
      const loc = req.body.location as Record<string, unknown>;
      const locFields = ['address', 'neighbourhood', 'city', 'postcode', 'country'] as const;
      for (const f of locFields) {
        if (loc[f] !== undefined) updates[`location.${f}`] = loc[f];
      }
      // Only update coordinates if the client sends a valid non-zero pair
      if (
        Array.isArray(loc.coordinates) &&
        loc.coordinates.length === 2 &&
        (loc.coordinates[0] !== 0 || loc.coordinates[1] !== 0)
      ) {
        updates['location.coordinates'] = loc.coordinates;
      }
    }

    const userDoc = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: false },
    ).lean();

    if (!userDoc) return next(createError('User not found', 404));

    res.json(withSignedAvatar(userDoc));
  } catch (err) {
    next(err);
  }
};

export const updateVideoIntro = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) return next(createError('No file uploaded', 400));

    const ext = req.file.mimetype.includes('mp4') ? 'mp4' : req.file.mimetype.includes('ogg') ? 'ogv' : 'webm';
    const key = `video-intros/${req.userId}-${Date.now()}.${ext}`;

    await uploadToS3(key, req.file.buffer, req.file.mimetype);
    await User.findByIdAndUpdate(req.userId, { videoIntro: key });

    const signedUrl = resolveAvatarUrl(key) as string;
    res.json({ videoIntro: signedUrl });
  } catch (err) {
    next(err);
  }
};

export const updateAvatar = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) return next(createError('No file uploaded', 400));

    const ext = req.file.mimetype.split('/')[1] ?? 'jpg';
    const key = `avatars/${req.userId}-${Date.now()}.${ext}`;

    // Upload to S3 — store just the key (not the full URL) so we can
    // generate fresh signed URLs on every read, regardless of bucket ACL settings.
    await uploadToS3(key, req.file.buffer, req.file.mimetype);

    await User.findByIdAndUpdate(req.userId, { avatar: key });

    // Return a signed URL so the client can display the avatar immediately
    const signedUrl = resolveAvatarUrl(key) as string;
    res.json({ avatar: signedUrl });
  } catch (err) {
    next(err);
  }
};

export const getNearbyUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { lng, lat, radius = 10 } = req.query;

    if (!lng || !lat) return next(createError('Coordinates required', 400));

    const users = await User.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radius) * 1000,
        },
      },
      _id: { $ne: req.userId },
      isActive: true,
    })
      .select('name avatar bio skills rating exchangeCount location')
      .lean();

    res.json(users.map(withSignedAvatar));
  } catch (err) {
    next(err);
  }
};

export const getUserPosts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const posts = await Post.find({ author: req.params.id, isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('author', 'name avatar')
      .lean();

    const total = await Post.countDocuments({ author: req.params.id, isActive: true });

    res.json({ posts, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

export const getUserExchanges = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: Record<string, unknown> = {
      $or: [{ requester: req.params.id }, { provider: req.params.id }],
    };
    if (status) filter.status = status;

    const exchanges = await Exchange.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('requester provider', 'name avatar rating')
      .lean();

    const total = await Exchange.countDocuments(filter);

    res.json({
      exchanges,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
};
