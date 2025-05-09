// server.js
const express     = require('express');
const cors        = require('cors');
const mongoose    = require('mongoose');
const jwt         = require('jsonwebtoken');
const bcrypt      = require('bcryptjs');
const multer      = require('multer');
const path        = require('path');
const nodemailer  = require('nodemailer');
const fs          = require('fs');
require('dotenv').config();

// Model imports
const Suggestion = require('./models/Suggestion');
const User       = require('./models/User');

// Route imports
const relatoriosRoutes  = require('./routes/relatorios');
const perguntasRoutes   = require('./routes/perguntas');
const suggestionsRoutes = require('./routes/suggestions');
const usersRoutes       = require('./routes/users');
const rankRoutes        = require('./routes/rank');
const reportsRoutes     = require('./routes/reports');

const app = express();

// Body parser
app.use(express.json());

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Serve static files from uploads
app.use('/uploads', express.static(uploadsDir));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// API routes
app.use('/api/relatorios',  relatoriosRoutes);
app.use('/api/perguntas',   perguntasRoutes);
app.use('/api/suggestions', suggestionsRoutes);
app.use('/api/users',       usersRoutes);
app.use('/api/rank',        rankRoutes);
app.use('/api/reports',     reportsRoutes);

// Helper to generate JWT tokens
const generateToken = (user) => jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Forgot password
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'Email não encontrado' });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  const transporter = nodemailer.createTransport({ /* config */ });
  try {
    await transporter.sendMail({ from: 'noreply@afm.com', to: email, subject: 'Recuperação de Senha', text: `Link: ${resetLink}` });
    res.json({ message: 'Link de recuperação enviado.' });
  } catch {
    res.status(500).json({ message: 'Erro ao enviar email.' });
  }
});

// Register
app.post('/api/register', async (req, res) => {
  const { name, userId, email, password } = req.body;
  const exists = await Promise.all([
    User.findOne({ email }),
    User.findOne({ userId })
  ]);
  if (exists[0] || exists[1]) return res.status(400).json({ message: 'Email ou ID já registado' });
  const hashed = await bcrypt.hash(password, 10);
  const newUser = new User({ name, userId, email, password: hashed, role: 'user' });
  await newUser.save();
  res.json({ token: generateToken(newUser) });
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, userId, password } = req.body;
  const user = await User.findOne({ $or: [{ email }, { userId }] });
  if (!user) return res.status(401).json({ message: 'Credenciais inválidas' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: 'Credenciais inválidas' });
  res.json({ token: generateToken(user) });
});

// Get profile
app.get('/api/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token não fornecido' });
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    res.json({ name: user.name, userId: user.userId, photo: user.photo || '/uploads/semperfil.jpg', role: user.role });
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
});

// Update profile
app.put('/api/profile', upload.single('photo'), async (req, res) => {
  const { name, email, password } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token não fornecido' });
  const { id } = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
  if (password) user.password = await bcrypt.hash(password, 10);
  user.name  = name  || user.name;
  user.email = email || user.email;
  if (req.file) user.photo = `/uploads/${req.file.filename}`;
  await user.save();
  res.json({ message: 'Perfil atualizado com sucesso' });
});

// Make admin
app.put('/api/make-admin', async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
  user.role = 'admin';
  await user.save();
  res.json({ message: 'Usuário agora é admin' });
});

// Rank event (if needed)
app.post('/api/rank/event', async (req, res) => {
  // lógica para registrar pontos
  res.status(204).end();
});

// Connect to Mongo and start server
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => app.listen(process.env.PORT || 5000, () => console.log('Servidor iniciado')))
  .catch(err => console.error('Erro Mongo:', err));
