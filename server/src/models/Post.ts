import mongoose, { Schema } from 'mongoose';
import { IPost } from '../types';

const postSchema = new Schema<IPost>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['skill', 'tool', 'event', 'question', 'general'],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 5000 },
    images: [{ type: String }],
    tags: [{ type: String, trim: true, lowercase: true }],
    group: { type: Schema.Types.ObjectId, ref: 'Group' },
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
    },
    upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    commentCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

postSchema.index({ location: '2dsphere' });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ group: 1, createdAt: -1 });
postSchema.index({ type: 1, createdAt: -1 });
postSchema.index({ tags: 1 });

export const Post = mongoose.model<IPost>('Post', postSchema);
