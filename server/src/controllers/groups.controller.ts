import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { Group } from '../models/Group';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { createError } from '../middleware/errorHandler';
import { Types } from 'mongoose';

export const getGroups = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 20, category, search, lng, lat, radius = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: Record<string, unknown> = { isActive: true, type: { $ne: 'private' } };
    if (category) filter.category = category;

    if (search) {
      filter.$text = { $search: search as string };
    }

    if (lng && lat) {
      filter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radius) * 1000,
        },
      };
    }

    const groups = await Group.find(filter)
      .sort({ memberCount: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('admin', 'name avatar')
      .lean();

    const total = await Group.countDocuments(filter);

    res.json({ groups, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

export const createGroup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description, type, category, tags, latitude, longitude, address } = req.body;

    const groupData: Record<string, unknown> = {
      name,
      description,
      type: type || 'public',
      category,
      tags: tags || [],
      admin: req.userId,
      moderators: [req.userId],
      members: [{ user: req.userId, role: 'admin', joinedAt: new Date() }],
      memberCount: 1,
    };

    if (latitude && longitude) {
      groupData.location = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
        address,
      };
    }

    const group = await Group.create(groupData);

    await User.findByIdAndUpdate(req.userId, { $push: { groups: group._id } });

    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
};

export const getGroup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const group = await Group.findOne({ _id: req.params.id, isActive: true })
      .populate('admin', 'name avatar')
      .populate('moderators', 'name avatar')
      .populate('members.user', 'name avatar')
      .lean();

    if (!group) return next(createError('Group not found', 404));

    res.json(group);
  } catch (err) {
    next(err);
  }
};

export const joinGroup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const group = await Group.findOne({ _id: req.params.id, isActive: true });

    if (!group) return next(createError('Group not found', 404));

    const isMember = group.members.some(
      (m) => m.user.toString() === req.userId
    );

    if (isMember) return next(createError('Already a member', 400));

    group.members.push({
      user: new Types.ObjectId(req.userId) as unknown as typeof group.members[0]['user'],
      role: 'member',
      joinedAt: new Date(),
    });
    group.memberCount += 1;
    await group.save();

    await User.findByIdAndUpdate(req.userId, { $push: { groups: group._id } });

    res.json({ message: 'Joined group successfully' });
  } catch (err) {
    next(err);
  }
};

export const leaveGroup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const group = await Group.findOne({ _id: req.params.id, isActive: true });

    if (!group) return next(createError('Group not found', 404));

    if (group.admin.toString() === req.userId) {
      return next(createError('Admin cannot leave. Transfer admin first.', 400));
    }

    group.members = group.members.filter((m) => m.user.toString() !== req.userId);
    group.memberCount = Math.max(0, group.memberCount - 1);
    await group.save();

    await User.findByIdAndUpdate(req.userId, { $pull: { groups: group._id } });

    res.json({ message: 'Left group successfully' });
  } catch (err) {
    next(err);
  }
};

export const getMyGroups = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const groups = await Group.find({
      'members.user': req.userId,
      isActive: true,
    })
      .populate('admin', 'name avatar')
      .sort({ updatedAt: -1 })
      .lean();

    res.json(groups);
  } catch (err) {
    next(err);
  }
};

export const updateGroup = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const group = await Group.findOne({
      _id: req.params.id,
      $or: [{ admin: req.userId }, { moderators: req.userId }],
    });

    if (!group) return next(createError('Group not found or not authorized', 404));

    const allowed = ['name', 'description', 'type', 'category', 'tags', 'coverImage'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        (group as unknown as Record<string, unknown>)[field] = req.body[field];
      }
    }

    await group.save();
    res.json(group);
  } catch (err) {
    next(err);
  }
};

export const getGroupMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const group = await Group.findOne({ _id: req.params.id, isActive: true });
    if (!group) return next(createError('Group not found', 404));

    const isMember = group.members.some((m) => m.user.toString() === req.userId);
    if (!isMember) return next(createError('Must be a member to view messages', 403));

    const messages = await Message.find({ group: req.params.id, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('sender', 'name avatar')
      .populate('replyTo')
      .lean();

    res.json(messages.reverse());
  } catch (err) {
    next(err);
  }
};
