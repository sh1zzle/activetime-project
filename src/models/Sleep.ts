import mongoose, { Schema, Document, Connection } from 'mongoose';

export interface ISleep extends Document {
  userId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  quality: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create a specific connection to the activetime database
let activeTimeDb: Connection;

if (mongoose.connection.readyState === 0) {
  activeTimeDb = mongoose.connection.useDb('activetime');
} else {
  // If mongoose is already connected, check if it's to the right database
  if (mongoose.connection.db?.databaseName !== 'activetime') {
    activeTimeDb = mongoose.connection.useDb('activetime');
  } else {
    activeTimeDb = mongoose.connection;
  }
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
    collection: 'sleeps', // Explicitly set collection name
  }
);

// Calculate sleep duration in hours
SleepSchema.virtual('duration').get(function (this: ISleep) {
  return (this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60 * 60);
});

// Ensure virtuals are included when converting to JSON
SleepSchema.set('toJSON', { virtuals: true });
SleepSchema.set('toObject', { virtuals: true });

// Use existing model or create new
const SleepModel =
  mongoose.models.Sleep || activeTimeDb.model<ISleep>('Sleep', SleepSchema);

export default SleepModel;
