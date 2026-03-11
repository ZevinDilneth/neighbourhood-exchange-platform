import mongoose, { Schema } from 'mongoose';
import { IGroup } from '../types';

const groupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 1000 },
    avatar: String,
    coverImage: String,
    type: { type: String, enum: ['public', 'private', 'restricted'], default: 'public' },
    category: { type: String, required: true },
    admin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    moderators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    members: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['admin', 'moderator', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    memberCount: { type: Number, default: 0 },
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
      address: String,
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

groupSchema.index({ location: '2dsphere' });
groupSchema.index({ name: 'text', description: 'text' });
groupSchema.index({ category: 1 });
groupSchema.index({ type: 1 });

export const Group = mongoose.model<IGroup>('Group', groupSchema);
