const express = require('express')
const router  = express.Router()
const Recomeco = require('../models/Recomeco')

// GET /api/recomecos
router.get('/recomecos', async (req, res) => {
  try {
    const docs = await Recomeco.find()
    res.json(docs)
  } catch (err) {
    res.status(500).json({ message: 'Erro ao carregar recomeços' })
  }
})

// POST /api/recomecos/respostas
router.post('/recomecos/respostas', async (req, res) => {
  try {
    // aqui entra a lógica de salvar ou processar as respostas...
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: 'Falha ao enviar respostas' })
  }
})

module.exports = router
