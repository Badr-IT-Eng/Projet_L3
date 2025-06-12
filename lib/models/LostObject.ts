import mongoose, { Schema, Document } from 'mongoose';

export interface Coordinates {
  x: number;
  y: number;
  lat?: number;
  lng?: number;
}

export interface ILostObject extends Document {
  name: string;
  location: string;
  date: Date;
  time: string;
  image: string;
  category: string;
  description: string;
  status: 'found' | 'claimed' | 'missing';
  coordinates: Coordinates;
  reporter?: string;
  claimedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  features?: Record<string, any>; // For AI feature vectors
}

const LostObjectSchema = new Schema<ILostObject>(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    time: { type: String, required: true },
    image: { type: String, required: true },
    category: { 
      type: String, 
      required: true,
      enum: ['bag', 'electronics', 'accessory', 'clothing', 'document', 'other']
    },
    description: { type: String, required: true },
    status: { 
      type: String, 
      required: true, 
      enum: ['found', 'claimed', 'missing'],
      default: 'found'
    },
    coordinates: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      lat: { type: Number },
      lng: { type: Number }
    },
    reporter: { type: Schema.Types.ObjectId, ref: 'User' },
    claimedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    features: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

// Add text search index
LostObjectSchema.index({ 
  name: 'text', 
  description: 'text', 
  location: 'text', 
  category: 'text' 
});

export default mongoose.models.LostObject || 
  mongoose.model<ILostObject>('LostObject', LostObjectSchema); 