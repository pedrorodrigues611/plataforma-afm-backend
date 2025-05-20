// routes/users.js
const express = require("express");
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const router  = express.Router();

// Só admins podem listar/editar users
const authAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Não autorizado" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") return res.status(403).json({ message: "Só admins" });
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
};

// GET /api/users — lista todos (sem senha)
router.get("/users", authAdmin, async (req, res) => {
  const users = await User.find().select("name userId email role banned createdAt");
  res.json(users);
});

// PATCH /api/users/:id — atualizar role e/ou banimento
router.patch("/users/:id", authAdmin, async (req, res) => {
  const { role, banned } = req.body;
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ message: "Usuário não encontrado" });
    if (role)  u.role   = role;
    if (banned !== undefined) u.banned = !!banned;
    await u.save();
    res.json({ message: "Usuário atualizado", user: u });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/make-admin
router.put('/make-admin', auth, async (req, res) => {
  if (req.userRole !== 'admin') return res.status(403).end();
  const { userId, promote } = req.body;
  const user = await User.findOne({ userId });
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
  user.role = promote ? 'admin' : 'user';
  await user.save();
  res.json({ message: 'Role atualizada' });
});

// PUT /api/users/:id/ban
router.put('/:id/ban', auth, async (req, res) => {
  if (req.userRole !== 'admin') return res.status(403).end();
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
  user.banned = true;
  await user.save();
  res.json({ message: 'Usuário banido' });
});



module.exports = router;
