const mongoose = require('mongoose');

const relatorioSchema = new mongoose.Schema({
  numero: {
    type: Number,
    required: true
  },
  resposta: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  aprovado: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('RelatorioQuestao', relatorioSchema);