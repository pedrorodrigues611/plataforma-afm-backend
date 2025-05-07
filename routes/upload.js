const multer = require('multer');
const path = require('path');

// Configuração do Multer para salvar as fotos de perfil
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // Pasta onde as fotos serão armazenadas
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));  // Nome do arquivo
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
