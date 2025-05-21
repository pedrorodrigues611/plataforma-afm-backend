const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  points:    { type: Number, required: true },
  type:      { 
    type: String, 
    enum: ['test','question'], 
    required: true,
    default: 'question'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TestResult', testResultSchema);
