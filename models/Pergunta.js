// models/Pergunta.js
const mongoose = require("mongoose");

const perguntaSchema = new mongoose.Schema({
  numero: Number,
  texto: String,               // antes era 'pergunta'
  opcoes: {
    A: String,
    B: String,
    C: String,
    D: String,
  },
  correta: String,             // antes era 'respostaCorreta'
}, { timestamps: true });

module.exports = mongoose.model("Pergunta", perguntaSchema);
