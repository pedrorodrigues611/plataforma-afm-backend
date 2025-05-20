// backend/models/TestResult.js
const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  points: { type: Number, required: true },
}, {
  timestamps: true    // cria automaticamente createdAt e updatedAt
});

module.exports = mongoose.model('TestResult', testResultSchema);
