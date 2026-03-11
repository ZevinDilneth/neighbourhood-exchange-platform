import { Request } from 'express';
import { Document, Types } from 'mongoose';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  videoIntro?: string;
  bio?: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
    address?: string;
    neighbourhood?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
  skills: { name: string; type: string; description: string; proficiency: string; availability: string; rate: string }[];
  interests: { name: string; category: string; description: string; level: string; willingToPay: string }[];
  ceuBalance: number;
  rating: number;
  reviewCount: number;
  exchangeCount: number;
  trustScore: number;
  role: 'user' | 'admin' | 'moderator';
  isVerified: boolean;
  isActive: boolean;
  groups: Types.ObjectId[];
  refreshTokens: string[];
  verificationToken?: string;
  verificationTokenExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPost extends Document {
  _id: Types.ObjectId;
  author: Types.ObjectId;
  type: 'skill' | 'tool' | 'event' | 'question' | 'general';
  title: string;
  content: string;
  images: string[];
  tags: string[];
  group?: Types.ObjectId;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  commentCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExchange extends Document {
  _id: Types.ObjectId;
  requester: Types.ObjectId;
  provider?: Types.ObjectId;
  type: 'skill' | 'tool' | 'service';
  title: string;
  description: string;
  offering: string;
  seeking: string;
  status: 'open' | 'pending' | 'active' | 'completed' | 'cancelled';
  scheduledDate?: Date;
  completedDate?: Date;
  ceuValue: number;
  images: string[];
  tags: string[];
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  messages: {
    sender: Types.ObjectId;
    content: string;
    timestamp: Date;
  }[];
  requesterRating?: number;
  providerRating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroup extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  avatar?: string;
  coverImage?: string;
  type: 'public' | 'private' | 'restricted';
  category: string;
  admin: Types.ObjectId;
  moderators: Types.ObjectId[];
  members: {
    user: Types.ObjectId;
    role: 'admin' | 'moderator' | 'member';
    joinedAt: Date;
  }[];
  memberCount: number;
  location?: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
  };
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage extends Document {
  _id: Types.ObjectId;
  group: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  replyTo?: Types.ObjectId;
  reactions: {
    emoji: string;
    users: Types.ObjectId[];
  }[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type TokenPayload = {
  userId: string;
  role: string;
};
