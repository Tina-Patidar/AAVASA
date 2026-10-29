import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    // select:false keeps the hash out of every query unless we explicitly ask for it
    password: { type: String, required: true, minlength: 8, select: false },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    city: { type: String, trim: true, maxlength: 80, default: '' },
    role: { type: String, enum: ['user', 'staff', 'admin'], default: 'user' },
    staffNotes: { type: String, trim: true, maxlength: 2000, default: '' },
    isActive: { type: Boolean, default: true },
    passwordChangedAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = new Date();
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    city: this.city,
    role: this.role,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};

userSchema.methods.toStaffSafeJSON = function toStaffSafeJSON() {
  return {
    ...this.toSafeJSON(),
    staffNotes: this.staffNotes || '',
  };
};

export const User = mongoose.model('User', userSchema);
