import mongoose, { Schema, Document, Connection } from 'mongoose';

export interface IProductivity extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  productivityRating: number; // 1-5 scale
  tasksCompleted: number;
  focusQuality: number; // 1-5 scale
  energyLevel: number; // 1-5 scale
  workHours: number;
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

const ProductivitySchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    productivityRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    tasksCompleted: {
      type: Number,
      required: true,
      min: 0,
    },
    focusQuality: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    energyLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    workHours: {
      type: Number,
      required: true,
      min: 0,
      max: 24,
    },
    notes: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    collection: 'productivity', // Explicitly set collection name
  }
);

// Calculate efficiency score (productivity rating * focus quality / work hours)
ProductivitySchema.virtual('efficiencyScore').get(function (
  this: IProductivity
) {
  if (this.workHours === 0) return 0;
  return ((this.productivityRating * this.focusQuality) / this.workHours) * 10;
});

// Calculate overall performance score
ProductivitySchema.virtual('performanceScore').get(function (
  this: IProductivity
) {
  return (this.productivityRating + this.focusQuality + this.energyLevel) / 3;
});

// Ensure virtuals are included when converting to JSON
ProductivitySchema.set('toJSON', { virtuals: true });
ProductivitySchema.set('toObject', { virtuals: true });

// Create unique index for userId and date to prevent duplicate entries for the same day
ProductivitySchema.index({ userId: 1, date: 1 }, { unique: true });

// Use existing model or create new
const ProductivityModel =
  mongoose.models.Productivity ||
  activeTimeDb.model<IProductivity>('Productivity', ProductivitySchema);

export default ProductivityModel;
