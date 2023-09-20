const mongoose = require('mongoose');
const mongoURI = 'mongodb+srv://andriygoryachiy16:gopro2323@cluster0.mncivfx.mongodb.net/';

export const connectDB = async () => {
  try {

    if (!mongoURI) {
      console.error('MONGODB_URI environment variable is not set');
    } else {
      await mongoose.connect(mongoURI);
      console.log('Connected to MongoDB');
    }
  
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
};
