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
  answeredCount:{ type: Number, default: 0 },  // ex: 20 perguntas num teste
  correctCount: { type: Number, default: 0 },  // ex: 18 certas num teste
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TestResult', testResultSchema);
