const mongoose = require('mongoose');

const reportedSchema = new mongoose.Schema({
  questionId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Question' }, // opcional, se tiver id
  text:         { type: String, required: true },  // texto da pergunta
  options:      {                                  // alineas originais
    A: String,
    B: String,
    C: String,
    D: String,
  },
  reportedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  explanation:  { type: String },                  // texto livre do user
  correct:      { type: String, enum: ['A','B','C','D'], required: true },
  status:       { type: String, enum: ['pending','resolved','rejected'], default: 'pending' },
  createdAt:    { type: Date, default: Date.now },
});

module.exports = mongoose.model('ReportedQuestion', reportedSchema);
