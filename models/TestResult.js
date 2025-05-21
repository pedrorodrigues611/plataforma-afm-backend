// backend/models/TestResult.js
const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  points: { type: Number, required: true },
  type:   { type: String, enum: ['question','test'], required: true },  // ← novo
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TestResult', testResultSchema);
