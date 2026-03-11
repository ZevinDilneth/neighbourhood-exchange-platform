import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { Post } from '../models/Post';
import { createError } from '../middleware/errorHandler';

// Returns the top 10 tags actually used across all active posts
export const getTags = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tags = await Post.aggregate([
      { $match: { isActive: true, 'tags.0': { $exists: true } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    res.json(tags.map((t) => ({ label: t._id as string, count: t.count as number })));
  } catch (err) {
    next(err);
  }
};

export const getFeed = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 20, type, lng, lat, radius = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: Record<string, unknown> = { isActive: true };
    if (type) filter.type = type;

    // Geospatial filter if coords provided
    if (lng && lat) {
      filter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radius) * 1000,
        },
      };
    }

    const rawPosts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('author', 'name avatar rating')
      .populate('group', 'name avatar')
      .lean();

    const total = await Post.countDocuments(filter);

    // Attach the authenticated user's vote status to each post
    const userId = req.userId;
    const posts = rawPosts.map((post) => {
      let userVote: 'up' | 'down' | null = null;
      if (userId) {
        if (post.upvotes.some((id) => id.toString() === userId)) userVote = 'up';
        else if (post.downvotes.some((id) => id.toString() === userId)) userVote = 'down';
      }
      return { ...post, userVote };
    });

    res.json({ posts, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

export const createPost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type, title, content, tags, group, latitude, longitude } = req.body;

    const postData: Record<string, unknown> = {
      author: req.userId,
      type,
      title,
      content,
      tags: tags || [],
      group: group || undefined,
    };

    if (latitude && longitude) {
      postData.location = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    const post = await Post.create(postData);
    const populated = await post.populate('author', 'name avatar rating');

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

export const getPost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const post = await Post.findOne({ _id: req.params.id, isActive: true })
      .populate('author', 'name avatar rating bio')
      .populate('group', 'name avatar')
      .lean();

    if (!post) return next(createError('Post not found', 404));

    const userId = req.userId;
    let userVote: 'up' | 'down' | null = null;
    if (userId) {
      if (post.upvotes.some((id) => id.toString() === userId)) userVote = 'up';
      else if (post.downvotes.some((id) => id.toString() === userId)) userVote = 'down';
    }

    res.json({ ...post, userVote });
  } catch (err) {
    next(err);
  }
};

export const votePost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { vote } = req.body; // 'up' | 'down' | null
    const userId = req.userId as string;
    const post = await Post.findById(req.params.id);

    if (!post || !post.isActive) return next(createError('Post not found', 404));

    const upIdx = post.upvotes.findIndex((id) => id.toString() === userId);
    const downIdx = post.downvotes.findIndex((id) => id.toString() === userId);

    // Remove existing votes
    if (upIdx > -1) post.upvotes.splice(upIdx, 1);
    if (downIdx > -1) post.downvotes.splice(downIdx, 1);

    if (vote === 'up') post.upvotes.push(userId as unknown as (typeof post.upvotes)[0]);
    if (vote === 'down') post.downvotes.push(userId as unknown as (typeof post.downvotes)[0]);

    await post.save();

    res.json({
      upvotes: post.upvotes.length,
      downvotes: post.downvotes.length,
      userVote: vote || null,
    });
  } catch (err) {
    next(err);
  }
};

export const deletePost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const post = await Post.findOne({ _id: req.params.id, author: req.userId });

    if (!post) return next(createError('Post not found or not authorized', 404));

    post.isActive = false;
    await post.save();

    res.json({ message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
};
