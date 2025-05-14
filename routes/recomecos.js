// routes/recomecos.js
const express = require('express');
const router = express.Router();
const Recomeco = require('../models/Recomeco'); // ajusta o caminho/modelo

// GET /api/recomecos
router.get('/', async (req, res) => {
  console.log('🔍 GET /api/recomecos chamado');
  try {
    const lista = await Recomeco.find()  // ou outro .aggregate(...)
    res.json(lista);
  } catch (err) {
    console.error('Erro ao carregar recomecos:', err);
    res.status(500).json({ message: 'Erro ao carregar recomecos' });
  }
});

module.exports = router;
