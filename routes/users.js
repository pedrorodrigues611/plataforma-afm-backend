// routes/users.js
const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const router  = express.Router();

// middleware de autenticação via Bearer Token
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Não autorizado' });
  try {
    const decoded     = jwt.verify(token, process.env.JWT_SECRET);
    req.userId        = decoded.id;
    req.userRole      = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

/**
 * PUT /api/make-admin
 * Promove ou despromove um utilizador
 */
router.put('/make-admin', auth, async (req, res) => {
  if (req.userRole !== 'admin') return res.status(403).json({ message: 'Sem permissão' });
  const { userId, promote } = req.body;
  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    user.role = promote ? 'admin' : 'user';
    await user.save();
    res.json({ message: 'Role atualizada com sucesso' });
  } catch (err) {
    console.error('❌ [make-admin] Erro:', err);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});


router.get('/', auth, async (req, res) => {
  // apenas admins podem listar todos
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado' });
  }

  try {
    const users = await User.find().select('-password'); // retira a password
    res.json(users);
  } catch (err) {
    console.error('Erro em GET /api/users:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});
/**
 * PUT /api/users/:id/ban
 * Banir um utilizador
 */
router.put('/:id/ban', auth, async (req, res) => {
  if (req.userRole !== 'admin') return res.status(403).json({ message: 'Sem permissão' });
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    user.banned = true;
    await user.save();
    res.json({ message: 'Usuário banido com sucesso' });
  } catch (err) {
    console.error('❌ [ban-user] Erro:', err);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
