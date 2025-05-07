const User = require('../models/User');  // Substitua por sua model User ou equivalente
const multer = require('multer');
const path = require('path');

// Configuração do Multer para upload da foto de perfil
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // O diretório onde as fotos serão armazenadas
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nome do arquivo com a extensão
  },
});

const upload = multer({ storage: storage });

// Função para atualizar o perfil do usuário
const updateProfile = async (req, res) => {
  const { name, email, password } = req.body;
  const userId = req.user.id;  // O id do usuário pode vir do token JWT

  // Verifica se uma foto foi enviada
  const photo = req.file ? req.file.path : undefined;

  try {
    // Atualize os dados do usuário no banco de dados (ajuste conforme necessário)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, password, photo },
      { new: true }  // Retorna o usuário atualizado
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      message: 'Perfil atualizado com sucesso!',
      user: updatedUser,  // Retorna o perfil atualizado
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar o perfil' });
  }
};

module.exports = { updateProfile };
