const express = require("express");
const router  = express.Router();
const Pergunta = require("../models/Pergunta");

// Agora o GET “/” responde com as 20 perguntas
router.get("/", async (req, res) => {
  try {
    const perguntas = await Pergunta.aggregate([{ $sample: { size: 20 } }]);
    res.json(perguntas);
  } catch (err) {
    res.status(500).json({ message: "Erro ao carregar perguntas" });
  }
});

module.exports = router;
