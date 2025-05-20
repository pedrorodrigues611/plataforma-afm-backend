// backend/routes/suggestions.js
const express             = require('express');
const jwt                 = require('jsonwebtoken');
const SuggestedQuestion   = require('../models/Suggestion');
const router              = express.Router();

// middleware de autenticação via Bearer Token
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Não autorizado' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

/**
 * POST /api/suggestions
 * Cria uma nova sugestão.
 * Body: { texto, opcoes: { A, B, C, D }, correta }
 */
router.post('/', auth, async (req, res) => {
  const { texto, opcoes, correta } = req.body;
  if (
    !texto ||
    !opcoes?.A || !opcoes?.B || !opcoes?.C || !opcoes?.D ||
    !['A','B','C','D'].includes(correta)
  ) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  try {
    const sug = new SuggestedQuestion({
      text:      texto,
      options:   opcoes,
      correct:   correta,
      createdBy: req.userId
    });
    await sug.save();
    return res.status(201).json({ message: 'Questão enviada para aprovação' });
  } catch (err) {
    console.error('❌ [POST /api/suggestions] Erro ao gravar sugestão:', err);
    return res.status(500).json({ message: 'Erro no servidor.' });
  }
});

/**
 * GET /api/suggestions
 * Lista todas as sugestões pendentes (admin).
 */
router.get('/', auth, async (req, res) => {
  try {
    const list = await SuggestedQuestion
      .find({ status: 'pending' })
      .populate('createdBy','userId name')
      .sort({ createdAt: -1 });
    return res.json(list);
  } catch (err) {
    console.error('❌ [GET /api/suggestions] Erro ao buscar pendentes:', err);
    return res.status(500).json({ message: 'Erro no servidor.' });
  }
});

/**
 * PATCH /api/suggestions/:id
 * Aprova ou rejeita uma sugestão (admin).
 * Body: { status: 'approved' | 'rejected' }
 */
router.patch('/:id', auth, async (req, res) => {
  const { id }     = req.params;
  const { status } = req.body;
  if (!['approved','rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status inválido' });
  }
  try {
    const sug = await SuggestedQuestion.findById(id);
    if (!sug) return res.status(404).json({ message: 'Sugestão não encontrada' });
    sug.status = status;
    await sug.save();
    return res.json({ message: 'Atualizado com sucesso' });
  } catch (err) {
    console.error('❌ [PATCH /api/suggestions/:id] Erro ao atualizar:', err);
    return res.status(500).json({ message: 'Erro no servidor.' });
  }
});

/**
 * GET /api/suggestions/my-suggestions
 * Lista todas as sugestões do usuário (qualquer status).
 */
router.get('/my-suggestions', auth, async (req, res) => {
  try {
    const mine = await SuggestedQuestion
      .find({ createdBy: req.userId })
      .sort({ createdAt: -1 });
    return res.json(mine);
  } catch (err) {
    console.error('❌ [GET /api/suggestions/my-suggestions] Erro ao buscar minhas sugestões:', err);
    return res.status(500).json({ message: 'Erro no servidor.' });
  }
});

module.exports = router;
