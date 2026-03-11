import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { Exchange } from '../models/Exchange';
import { User } from '../models/User';
import { createError } from '../middleware/errorHandler';

export const getExchanges = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 20, type, status = 'open', lng, lat, radius = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: Record<string, unknown> = { status };
    if (type) filter.type = type;

    if (lng && lat) {
      filter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radius) * 1000,
        },
      };
    }

    const exchanges = await Exchange.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('requester provider', 'name avatar rating')
      .lean();

    const total = await Exchange.countDocuments(filter);

    res.json({ exchanges, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

export const createExchange = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type, title, description, offering, seeking, ceuValue, tags, latitude, longitude } =
      req.body;

    const exchangeData: Record<string, unknown> = {
      requester: req.userId,
      type,
      title,
      description,
      offering,
      seeking,
      ceuValue: ceuValue || 1,
      tags: tags || [],
    };

    if (latitude && longitude) {
      exchangeData.location = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    const exchange = await Exchange.create(exchangeData);
    const populated = await exchange.populate('requester', 'name avatar rating');

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

export const getExchange = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const exchange = await Exchange.findById(req.params.id)
      .populate('requester provider', 'name avatar rating bio skills')
      .lean();

    if (!exchange) return next(createError('Exchange not found', 404));

    res.json(exchange);
  } catch (err) {
    next(err);
  }
};

export const respondToExchange = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const exchange = await Exchange.findOne({
      _id: req.params.id,
      status: 'open',
    });

    if (!exchange) return next(createError('Exchange not found or not open', 404));

    if (exchange.requester.toString() === req.userId) {
      return next(createError('Cannot respond to your own exchange', 400));
    }

    exchange.provider = req.userId as unknown as typeof exchange.provider;
    exchange.status = 'pending';
    await exchange.save();

    const populated = await exchange.populate('requester provider', 'name avatar rating');

    res.json(populated);
  } catch (err) {
    next(err);
  }
};

export const updateExchangeStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.body;
    const exchange = await Exchange.findById(req.params.id);

    if (!exchange) return next(createError('Exchange not found', 404));

    const isParty =
      exchange.requester.toString() === req.userId ||
      exchange.provider?.toString() === req.userId;

    if (!isParty) return next(createError('Not authorized', 403));

    exchange.status = status;

    if (status === 'completed') {
      exchange.completedDate = new Date();
      await User.findByIdAndUpdate(exchange.requester, { $inc: { exchangeCount: 1 } });
      if (exchange.provider) {
        await User.findByIdAndUpdate(exchange.provider, { $inc: { exchangeCount: 1 } });
      }
    }

    await exchange.save();
    res.json(exchange);
  } catch (err) {
    next(err);
  }
};

export const sendExchangeMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { content } = req.body;
    const exchange = await Exchange.findById(req.params.id);

    if (!exchange) return next(createError('Exchange not found', 404));

    const isParty =
      exchange.requester.toString() === req.userId ||
      exchange.provider?.toString() === req.userId;

    if (!isParty) return next(createError('Not authorized', 403));

    exchange.messages.push({
      sender: req.userId as unknown as typeof exchange.messages[0]['sender'],
      content,
      timestamp: new Date(),
    });

    await exchange.save();
    res.json({ message: 'Message sent' });
  } catch (err) {
    next(err);
  }
};

export const getMyExchanges = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: Record<string, unknown> = {
      $or: [{ requester: req.userId }, { provider: req.userId }],
    };
    if (status) filter.status = status;

    const exchanges = await Exchange.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('requester provider', 'name avatar rating')
      .lean();

    const total = await Exchange.countDocuments(filter);

    res.json({ exchanges, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};
