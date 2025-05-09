import mongoose, { Schema, Document, Connection } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
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

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Use existing model or create new
const UserModel =
  mongoose.models.User || activeTimeDb.model<IUser>('User', UserSchema);

export default UserModel;
