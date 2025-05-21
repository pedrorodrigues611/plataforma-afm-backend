const mongoose = require('mongoose');

const reportedSchema = new mongoose.Schema({
  questionId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Pergunta' },
  text:           { type: String, required: true },
  options:        {
                    A: String,
                    B: String,
                    C: String,
                    D: String,
                  },
  correct:        { type: String, enum: ['A','B','C','D'], required: true },
  reportedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  explanation:    { type: String },
  status:         { type: String, enum: ['pending','resolved','rejected'], default: 'pending' },
  rejectionReason:{ type: String },
  handledBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  handledAt:      { type: Date },
  createdAt:      { type: Date, default: Date.now },
});

// índice para acelerar buscas de pendentes
reportedSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ReportedQuestion', reportedSchema);
