const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const nodemailer = require("nodemailer");  // Importar o Nodemailer
const fs = require('fs'); // Importa o módulo fs para manipulação de arquivos


const Suggestion = require('./models/Suggestion');
require("dotenv").config();

const app = express();


app.use(express.json());


app.use(cors({
  origin: '*', 
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));




app.use("/uploads", express.static(path.join(__dirname, "uploads")));



const relatoriosRoutes = require('./routes/relatorios');
const perguntasRoutes = require('./routes/perguntas');
const suggestionsRoutes = require('./routes/suggestions');
const usersRoutes        = require("./routes/users");
const rankRoutes = require("./routes/rank");
const reportsRoutes = require('./routes/reports');

app.use("/api", relatoriosRoutes);
app.use('/api', perguntasRoutes); 
app.use('/api', suggestionsRoutes);
app.use("/api", usersRoutes);
app.use("/api", rankRoutes);
app.use('/api', reportsRoutes);


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("Mongo conectado"))
.catch(err => console.error("Erro Mongo:", err));

// garante existência da pasta
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Multer (se ainda precisares dele)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });




// Rota para obter o perfil do usuário
app.get("/api/profile", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token não fornecido" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

    // Retorne também o campo `photo`
    res.json({
      name:   user.name,
      userId: user.userId,
      rank:   user.rank,
      photo:  user.photo,     // ex: "/uploads/169xxx.jpg"
      role:   user.role
    });
  } catch (err) {
    res.status(401).json({ message: "Token inválido" });
  }
});






// Importa o modelo User a partir do ficheiro models/User.js
const User = require('./models/User'); 


const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Enviar token de recuperação de senha por email
app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;

  // Verificar se o email existe no banco de dados
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "Email não encontrado" });
  }

  // Gerar o token de recuperação
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h", // O token expira em 1 hora
  });

  // Criar o link de recuperação
  const resetLink = `http://localhost:5173/reset-password?token=${token}`;

  // Configuração do Nodemailer para envio de email
  const transporter = nodemailer.createTransport({
    service: "gmail",  // ou outro serviço de sua preferência
    auth: {
      user: "your-email@gmail.com",  // Substitua com seu email
      pass: "your-email-password",   // Substitua com sua senha de app
    },
  });

  const mailOptions = {
    from: "your-email@gmail.com",
    to: email,
    subject: "Recuperação de Senha",
    text: `Clique no link para redefinir sua senha: ${resetLink}`,
  };

  // Enviar email com o link de recuperação
  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Link de recuperação enviado para o email." });
  } catch (err) {
    res.status(500).json({ message: "Erro ao enviar o email." });
  }
});

// Rota de registro de usuário
app.post("/api/register", async (req, res) => {
  const { name, userId, email, password } = req.body;

  try {
    const existingEmail = await User.findOne({ email });
    const existingId = await User.findOne({ userId });

    if (existingEmail || existingId) {
      return res.status(400).json({ message: "Email ou ID já registado" });
    }

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar um novo usuário com role padrão de "user"
    const newUser = new User({
      name, 
      userId, 
      email, 
      password: hashedPassword,
      role: "user"  // Role padrão é "user"
    });

    // Salvar o novo usuário
    await newUser.save();
    const token = generateToken(newUser);
    res.json({ token });

  } catch (error) {
    console.error("Erro ao registrar usuário:", error);  // Log detalhado
    res.status(500).json({ message: "Erro ao registrar o usuário" });
  }
});


app.post("/api/login", async (req, res) => {
  const { email, userId, password } = req.body;

  // Procurar o usuário usando o email ou userId
  const user = await User.findOne({
    $or: [{ email: email }, { userId: userId }],
  });

  if (!user) {
    return res.status(401).json({ message: "Credenciais inválidas" }); // Caso o email ou userId não exista
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ message: "Credenciais inválidas" }); // Caso a senha não seja válida
  }

  const token = generateToken(user);  // Gera o token para o usuário
  res.json({ token });  // Envia o token como resposta
});



// Atualizar perfil de usuário
app.put("/api/profile", upload.single('photo'), async (req, res) => {
  const { name, email, password } = req.body;
  const token = req.headers.authorization.split(" ")[1]; // Obter o token do cabeçalho
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id); // Buscar o usuário pelo ID decodificado
  if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

  // Se a senha for fornecida, criptografe-a
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
  }

  // Atualiza os campos do usuário com os novos dados (incluindo a foto, se fornecida)
  user.name = name || user.name;
  user.email = email || user.email;

  // Se houver uma nova foto, atualiza o caminho da foto no banco de dados
  if (req.file) {
    user.photo = `/uploads/${req.file.filename}`; // agora: '/uploads/12345.jpg'
  } else {
    // Se nenhuma foto for enviada, a foto padrão será usada
    user.photo = '/uploads/semperfil.jpg';
  }

  await user.save(); // Salva as alterações no banco de dados

  res.json({ message: 'Perfil atualizado com sucesso', user });
});

// Rota para conceder permissões de admin (modificar a role de um usuário)
app.put("/api/make-admin", async (req, res) => {
  const { userId } = req.body;

  // Encontrar o usuário
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  // Atualizar a role do usuário para admin
  user.role = "admin"; // Agora o usuário será admin

  await user.save();  // Salvar as alterações
  res.status(200).json({ message: "Usuário agora é admin", user });
});


app.listen(5000, () => {
  console.log("Servidor backend iniciado na porta 5000");
});
