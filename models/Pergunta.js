const mongoose = require("mongoose");

const perguntaSchema = new mongoose.Schema({
  numero: Number, // Número da pergunta
  pergunta: String, // Texto da pergunta
  opcoes: { // Opções de resposta
    A: String,
    B: String,
    C: String,
    D: String,
  },
  respostaCorreta: String, // Resposta correta (A, B, C ou D)
});

const Pergunta = mongoose.model("Pergunta", perguntaSchema);

module.exports = Pergunta;
