// backend/models/Suggestion.js
const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  text:      { type: String, required: true },
  options:   {
    A: { type: String, required: true },
    B: { type: String, required: true },
    C: { type: String, required: true },
    D: { type: String, required: true },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status:    { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Suggestion', suggestionSchema);
