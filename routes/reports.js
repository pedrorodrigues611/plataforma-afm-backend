const express = require('express');
const jwt     = require('jsonwebtoken');
const Reported = require('../models/ReportedQuestion');
const router  = express.Router();

// middleware auth
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Não autorizado' });
  try {
    const dec = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = dec.id; req.userRole = dec.role;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
}

// só admins
function authAdmin(req, res, next){
  if (req.userRole!=='admin') return res.status(403).json({ message: 'Só admins' });
  next();
}

// POST /api/report-question
router.post('/report-question', auth, async (req, res) => {
  const { questionId, text, options, correct, explanation } = req.body;
  if (!text || !options || !correct) 
    return res.status(400).json({ message: 'Dados em falta' });
  const rpt = new Reported({
    questionId, text, options,
    correct, explanation, reportedBy: req.userId
  });
  await rpt.save();
  res.status(201).json({ message: 'Report submetido' });
});

// GET /api/report-questions — só admins veem
router.get('/report-questions', auth, authAdmin, async (req,res) => {
  const list = await Reported.find({ status:'pending' })
    .sort('-createdAt')
    .populate('reportedBy','userId name');
  res.json(list);
});

// PATCH /api/report-questions/:id — admin resolve/rejeita
router.patch('/report-questions/:id', auth, authAdmin, async (req,res) => {
  const { status } = req.body;
  if (!['resolved','rejected'].includes(status)) 
    return res.status(400).json({ message: 'Status inválido' });
  const rpt = await Reported.findById(req.params.id);
  if (!rpt) return res.status(404).json({ message:'Não encontrado' });
  rpt.status = status;
  await rpt.save();
  res.json({ message: 'Report atualizado' });
});

module.exports = router;
