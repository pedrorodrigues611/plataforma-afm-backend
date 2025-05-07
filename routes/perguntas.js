const express = require("express");
const router = express.Router();
const Pergunta = require("../models/Pergunta"); // Modelo que contém as perguntas

// Endpoint para obter 20 perguntas aleatórias para o teste
router.get("/teste", async (req, res) => {
  try {
    // Seleciona aleatoriamente 20 perguntas da base de dados
    const perguntas = await Pergunta.aggregate([{ $sample: { size: 20 } }]);

    res.json(perguntas); // Envia as perguntas como resposta JSON
  } catch (err) {
    res.status(500).json({ message: "Erro ao carregar perguntas" });
  }
});


module.exports = router;
