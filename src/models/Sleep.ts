import mongoose, { Schema, Document } from 'mongoose';

export interface ISleep extends Document {
  userId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  quality: number; // 1-5 scale
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SleepSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    quality: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    notes: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate sleep duration in hours
SleepSchema.virtual('duration').get(function (this: ISleep) {
  return (this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60 * 60);
});

// Ensure virtuals are included when converting to JSON
SleepSchema.set('toJSON', { virtuals: true });
SleepSchema.set('toObject', { virtuals: true });

export default mongoose.models.Sleep ||
  mongoose.model<ISleep>('Sleep', SleepSchema);
