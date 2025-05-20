// backend/routes/rank.js
const express = require('express');
const jwt     = require('jsonwebtoken');
const router  = express.Router();

// Model imports
const TestResult = require('../models/TestResult');
const Medal      = require('../models/Medal');
const User       = require('../models/User');

// Authentication middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Não autorizado' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId   = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

/**
 * POST /api/rank/event
 * Regista um evento de pontuação para o utilizador
 * body: { points: Number }
 */
router.post('/event', auth, async (req, res) => {
  const { points } = req.body;
  if (typeof points !== 'number') {
    return res.status(400).json({ message: 'Pontos inválidos' });
  }
  try {
    await TestResult.create({ userId: req.userId, points });
    res.status(201).json({ message: 'Evento de ranking registado' });
  } catch (err) {
    console.error('Erro ao registar evento de ranking:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

/**
 * GET /api/rank/weekly
 * Retorna os 10 primeiros desta semana (segunda–domingo)
 */
router.get('/weekly', auth, async (req, res) => {
  try {
    const now = new Date();
    const day = now.getDay(); // 0=Dom ... 6=Sáb
    const diff = (day + 6) % 7;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0,0,0,0);

    const top10 = await TestResult.aggregate([
      { $match: { createdAt: { $gte: weekStart } } },
      { $group: { _id: '$userId', points: { $sum: '$points' } } },
      { $sort: { points: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $project: { userId: '$user.userId', photo:  '$user.photo', name: '$user.name', points: 1 } }
    ]);

    res.json(top10);
  } catch (err) {
    console.error('Erro em GET /api/rank/weekly:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

/**
 * GET /api/rank/medals
 * Retorna top3 de medalhas e as do próprio usuário
 */
router.get('/medals', auth, async (req, res) => {
  try {
    const agg = await Medal.aggregate([
      {
        $group: {
          _id: '$userId',
          gold:   { $sum: { $cond: [{ $eq: ['$type', 'gold'] }, 1, 0] } },
          silver: { $sum: { $cond: [{ $eq: ['$type', 'silver'] }, 1, 0] } },
          bronze: { $sum: { $cond: [{ $eq: ['$type', 'bronze'] }, 1, 0] } }
        }
      },
      {
        $project: {
          userId: '$_id',
          score:  { $add: [ { $multiply: ['$gold', 3] }, { $multiply: ['$silver', 2] }, '$bronze' ] },
          gold:1, silver:1, bronze:1
        }
      },
      { $sort: { score: -1 } }
    ]);

    const top3agg = agg.slice(0, 3);
    const top3 = await Promise.all(top3agg.map(async u => {
      const user = await User.findById(u._id);
      return { userId: user.userId, name: user.name, gold: u.gold, silver: u.silver, bronze: u.bronze };
    }));

    const mineData = agg.find(u => u._id.toString() === req.userId) || { gold:0, silver:0, bronze:0 };
    const mine = { gold: mineData.gold, silver: mineData.silver, bronze: mineData.bronze };

    res.json({ top3, mine });
  } catch (err) {
    console.error('Erro em GET /api/rank/medals:', err);
    res.status(500).json({ message: 'Erro interno' });
  }
});

module.exports = router;
