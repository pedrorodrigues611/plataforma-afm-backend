// backend/routes/rank.js
const express = require('express')
const jwt     = require('jsonwebtoken')
const router  = express.Router()

// Model imports
const TestResult = require('../models/TestResult')
const Medal      = require('../models/Medal')
const User       = require('../models/User')

// Authentication middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Não autorizado' })
  try {
    const decoded       = jwt.verify(token, process.env.JWT_SECRET)
    req.userId          = decoded.id
    req.userRole        = decoded.role
    next()
  } catch {
    return res.status(401).json({ message: 'Token inválido' })
  }
}

/**
 * POST /api/rank/event
 * Regista um evento de pontuação para o utilizador
 * body: { points: Number, type?: 'test'|'question' }
 */
router.post('/event', auth, async (req, res) => {
  const { points, type = 'question' } = req.body
  if (typeof points !== 'number' || !['test','question'].includes(type)) {
    return res.status(400).json({ message: 'Dados inválidos' })
  }
  try {
    await TestResult.create({ 
      userId: req.userId, 
      points, 
      type, 
      createdAt: new Date() 
    })
    res.status(201).json({ message: 'Evento de ranking registado' })
  } catch (err) {
    console.error('Erro ao registar evento de ranking:', err)
    res.status(500).json({ message: 'Erro interno' })
  }
})

/**
 * GET /api/rank/weekly
 * Retorna top10 da semana (7 dias corridos)
 */
router.get('/weekly', auth, async (req, res) => {
  try {
    // define início da semana (7 dias atrás, à meia-noite)
    const today     = new Date()
    const weekStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 6, // inclui hoje + 6 dias atrás = 7 dias
      0, 0, 0, 0
    )

    const top10 = await TestResult.aggregate([
      // filtra apenas eventos desta semana
      { $match: { createdAt: { $gte: weekStart } } },

      // agrupa por utilizador, soma pontos e conta tipos
      { $group: {
          _id:      '$userId',
          points:   { $sum: '$points' },
          tests:    { $sum: { $cond: [ { $eq: ['$type','test']     }, 1, 0 ] } },
          answered: { $sum: { $cond: [ { $eq: ['$type','question'] }, 1, 0 ] } },
          correct:  { $sum: {
            $cond: [
              { $and: [
                  { $eq: ['$type','question'] },
                  { $gt: ['$points', 0] }
                ]
              },
              1,
              0
            ]
          }}
      }},

      // ordena por pontos e limita a 10
      { $sort: { points: -1 } },
      { $limit: 10 },

      // lookup para puxar nome, foto e userId
      { $lookup: {
          from:         'users',
          localField:   '_id',
          foreignField: '_id',
          as:           'user'
      }},
      { $unwind: '$user' },

      // projecta o shape final
      { $project: {
          _id:      0,
          userId:   '$user.userId',
          name:     '$user.name',
          photo:    '$user.photo',
          points:   1,
          tests:    1,
          answered: 1,
          accuracy: {
            $cond: [
              { $eq: ['$answered', 0] },
              0,
              { $multiply: [
                  { $divide: ['$correct', '$answered'] },
                  100
                ]}
            ]
          }
      }}
    ])

    res.json(top10)
  } catch (err) {
    console.error('Erro em GET /api/rank/weekly:', err)
    res.status(500).json({ message: 'Erro no servidor.' })
  }
})

/**
 * GET /api/rank/medals
 * Retorna top3 de medalhistas e as estatísticas do próprio usuário
 */
router.get('/medals', auth, async (req, res) => {
  try {
    const agg = await Medal.aggregate([
      { $group: {
          _id:    '$userId',
          gold:   { $sum: { $cond:[{ $eq:['$type','gold']   },1,0] } },
          silver: { $sum: { $cond:[{ $eq:['$type','silver'] },1,0] } },
          bronze: { $sum: { $cond:[{ $eq:['$type','bronze'] },1,0] } }
      }},
      { $project: {
          userId: '$_id',
          gold:1, silver:1, bronze:1,
          score: { $add:[
            { $multiply:['$gold',3] },
            { $multiply:['$silver',2] },
            '$bronze'
          ]}
      }},
      { $sort: { score:-1 } }
    ])

    // top3
    const top3agg = agg.slice(0,3)
    const top3 = await Promise.all(top3agg.map(async u => {
      const user = await User.findById(u._id)
      return {
        userId: user.userId,
        name:   user.name,
        gold:   u.gold,
        silver: u.silver,
        bronze: u.bronze
      }
    }))

    // estatísticas do próprio
    const mineData = agg.find(u => u._id.toString() === req.userId) || { gold:0, silver:0, bronze:0 }
    const mine     = { gold: mineData.gold, silver: mineData.silver, bronze: mineData.bronze }

    res.json({ top3, mine })
  } catch (err) {
    console.error('Erro em GET /api/rank/medals:', err)
    res.status(500).json({ message: 'Erro interno' })
  }
})

module.exports = router
