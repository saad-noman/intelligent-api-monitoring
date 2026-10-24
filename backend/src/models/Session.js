// Login session. Stores only the hash of the token given to the client. MongoDB's TTL
// index removes documents once expiresAt has passed.
import mongoose from 'mongoose';

const { Schema } = mongoose;

const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Session = mongoose.model('Session', sessionSchema);
