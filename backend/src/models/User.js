// User account. The account email is used for registration and login only; the
// alert-recipient email is a separate, user-configurable address and is never
// assumed to equal the account email.
import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    // Excluded from queries by default; load explicitly with .select('+passwordHash').
    passwordHash: { type: String, required: true, select: false },
    alertEmail: { type: String, default: null, trim: true, lowercase: true },
    // On/off switch for anomaly report emails, controlled from Account Settings.
    emailReportsEnabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const User = mongoose.model('User', userSchema);
