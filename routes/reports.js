// backend/routes/reports.js
const express = require('express');
const jwt     = require('jsonwebtoken');
const Report  = require('../models/ReportedQuestion');
const Pergunta = require('../models/Pergunta');
const User     = require('../models/User');
const router  = express.Router();

// middleware de autenticação
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Não autorizado' });
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = id;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

/**
 * GET /api/reports
 * Lista todos os reports pendentes
 */
router.get('/', auth, async (req, res) => {
  try {
    const reports = await Report.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .populate('reporter', 'userId')         // para sabermos quem reportou
      .populate('questionId');                // se quiseres dados extra da pergunta
    res.json(reports);
  } catch (err) {
    console.error('Erro em GET /api/reports:', err);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
});

/**
 * PATCH /api/reports/:id
 * Marca report como tratado (ou rejeitado)
 */
router.patch('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // ex: 'dismiss' ou 'approve'
  try {
    await Report.findByIdAndUpdate(id, { status: 'handled', handledBy: req.userId, handledAt: new Date(), action });
    res.json({ message: 'Report atualizado.' });
  } catch (err) {
    console.error('Erro em PATCH /api/reports/:id:', err);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
});

module.exports = router;
