// backend/routes/recomecos.js
const express = require('express');
const router = express.Router();
const Recomeco = require('../models/Recomeco');

// GET /api/recomecos  → devolve todos os recomeços
router.get('/recomecos', async (req, res) => {
  try {
    const lista = await Recomeco.find();
    res.json(lista);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao carregar recomeços' });
  }
});

module.exports = router;
