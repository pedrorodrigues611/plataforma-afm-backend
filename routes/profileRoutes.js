// backend/routes/profileRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Configuração do Multer para upload de foto
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Defina o diretório para os arquivos
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Salve a foto com um nome único
  }
});

const upload = multer({ storage: storage });

// Rota para atualizar perfil (incluindo foto)
router.put('/api/profile', upload.single('photo'), (req, res) => {
  const { name, email, password } = req.body;
  const userId = req.user.id;  // Aqui, você deve ter um método de autenticação (como JWT) para identificar o usuário

  // Se a foto foi carregada, obtenha o caminho dela
  const photo = req.file ? req.file.path : undefined;

  // Lógica para atualizar o perfil do usuário no banco de dados
  // Exemplo: Update User model in the database
  // User.update({ name, email, password, photo }, { where: { id: userId } });

  res.json({ message: 'Perfil atualizado com sucesso!', photo });
});

module.exports = router;
