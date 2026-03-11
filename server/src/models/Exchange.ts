import mongoose, { Schema } from 'mongoose';
import { IExchange } from '../types';

const exchangeSchema = new Schema<IExchange>(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['skill', 'tool', 'service'], required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 2000 },
    offering: { type: String, required: true, maxlength: 500 },
    seeking: { type: String, required: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['open', 'pending', 'active', 'completed', 'cancelled'],
      default: 'open',
    },
    scheduledDate: Date,
    completedDate: Date,
    ceuValue: { type: Number, default: 1, min: 0 },
    images: [{ type: String }],
    tags: [{ type: String, trim: true, lowercase: true }],
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
    },
    messages: [
      {
        sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    requesterRating: { type: Number, min: 1, max: 5 },
    providerRating: { type: Number, min: 1, max: 5 },
  },
  { timestamps: true }
);

exchangeSchema.index({ location: '2dsphere' });
exchangeSchema.index({ requester: 1, createdAt: -1 });
exchangeSchema.index({ status: 1, createdAt: -1 });
exchangeSchema.index({ type: 1, status: 1 });

export const Exchange = mongoose.model<IExchange>('Exchange', exchangeSchema);
