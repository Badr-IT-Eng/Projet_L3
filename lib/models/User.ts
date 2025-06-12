import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  password?: string; // Hashed password
  role: 'user' | 'admin';
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
  contactInformation?: string;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    password: { type: String },
    role: { type: String, required: true, enum: ['user', 'admin'], default: 'user' },
    emailVerified: { type: Date },
    contactInformation: { type: String }
  },
  { timestamps: true }
);

export default mongoose.models.User || 
  mongoose.model<IUser>('User', UserSchema); 