import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  _id: { type: String },
  address: String,
  chain: String,
});

const Token = mongoose.model('Token', tokenSchema);

export default Token;
