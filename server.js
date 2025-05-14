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
const User       = require('./models/User');
const Suggestion = require('./models/Suggestion');

// Route imports
const relatoriosRoutes  = require('./routes/relatorios');
const perguntasRoutes   = require('./routes/perguntas');
const suggestionsRoutes = require('./routes/suggestions');
const usersRoutes       = require('./routes/users');
const rankRoutes        = require('./routes/rank');
const reportsRoutes     = require('./routes/reports');
const recomecosRoutes = require('./routes/recomecos');
const Pergunta = require('./models/Pergunta');
const app = express();


// server.js (logo após const app = express();)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] → ${req.method} ${req.url}`);
  next();
});


//Body parser: transforma JSON no req.body
app.use(express.json());




// CORS global: libera todas as rotas para qualquer origem
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));




app.get('/api/teste', async (req, res) => {
  try {
    const lista = await Pergunta.find();  
    res.json(lista);
  } catch (err) {
    console.error('GET /api/teste:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});



// Ensure uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

// Multer setup
const storage = multer.diskStorage({ destination: (req, file, cb) => cb(null, uploadsDir), filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)) });
const upload = multer({ storage });

// API routes
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/perguntas', perguntasRoutes);
app.use('/api/suggestions', suggestionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/rank', rankRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/recomecos', recomecosRoutes);

// Generate JWT token
const generateToken = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });


const cors = require('cors');
app.use(cors({
  origin: [
    'https://plataforma-afm.vercel.app',
    'http://localhost:3000'
  ]
}));

// Forgot password
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email }); if (!user) return res.status(404).json({ message: 'Email não encontrado' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const transporter = nodemailer.createTransport({/* config */});
    await transporter.sendMail({ from: 'noreply@afm.com', to: email, subject: 'Recuperação de Senha', text: `Link: ${resetLink}` });
    res.json({ message: 'Link de recuperação enviado.' });
  } catch (err) { console.error('POST /api/forgot-password:', err); res.status(500).json({ message: 'Erro ao enviar email.' }); }
});

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, userId, email, password } = req.body;
    const [byEmail, byId] = await Promise.all([ User.findOne({ email }), User.findOne({ userId }) ]);
    if (byEmail || byId) return res.status(400).json({ message: 'Email ou ID já registado' });
    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ name, userId, email, password: hashed, role: 'user' }); await newUser.save();
    res.json({ token: generateToken(newUser) });
  } catch (err) { console.error('POST /api/register:', err); res.status(500).json({ message: 'Erro ao registrar usuário' }); }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, userId, password } = req.body;
    const user = await User.findOne({ $or: [{ email }, { userId }] });
    if (!user) return res.status(401).json({ message: 'Credenciais inválidas' });
    const valid = await bcrypt.compare(password, user.password); if (!valid) return res.status(401).json({ message: 'Credenciais inválidas' });
    res.json({ token: generateToken(user) });
  } catch (err) { console.error('POST /api/login:', err); res.status(500).json({ message: 'Erro ao autenticar' }); }
});

// Get profile
app.get('/api/profile', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'Token não fornecido' });
  try {
    const { id } = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    // Retorna também o email para que o front não sobrescreva com undefined
    res.json({ 
      name:  user.name, 
      userId: user.userId,
      email: user.email,
      photo: user.photo || '/uploads/semperfil.jpg',
      role:  user.role 
    });
  } catch (err) {
    console.error('GET /api/profile:', err);
    res.status(401).json({ message: 'Token inválido' });
  }
});

// Handle preflight
app.options('/api/profile', cors());

// Update profile
app.put('/api/profile', upload.single('photo'), async (req, res) => {
  const auth = req.headers.authorization; if (!auth) return res.status(401).json({ message: 'Token não fornecido' });
  try {
    const { id } = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findById(id); if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    const { name, email, password } = req.body;
    if (password) user.password = await bcrypt.hash(password, 10);
    if (name)     user.name  = name;
    // Only update email if provided and not blank
    if (typeof email === 'string' && email.trim() !== '') {
      user.email = email.trim();
    }
    if (req.file) user.photo = `/uploads/${req.file.filename}`;
    await user.save();
    res.json({ message: 'Perfil atualizado com sucesso' });
  } catch (err) {
    console.error('PUT /api/profile:', err);
    if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Make admin
app.put('/api/make-admin', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId); if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    user.role = 'admin'; await user.save();
    res.json({ message: 'Usuário agora é admin' });
  } catch (err) { console.error('PUT /api/make-admin:', err); res.status(500).json({ message: 'Erro interno do servidor' }); }
});

// Rank event & health-check
app.post('/api/rank/event', (req, res) => res.status(204).end());
app.get('/', (req, res) => res.send('Servidor AFM UP'));

// Connect to Mongo & start
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => app.listen(process.env.PORT || 5000, () => console.log('Servidor iniciado')))
  .catch(err => console.error('Erro Mongo:', err));
