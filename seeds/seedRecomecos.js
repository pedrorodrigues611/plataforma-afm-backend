// backend/seeds/seedRecomecos.js

const fs       = require('fs');
const path     = require('path');
const mongoose = require('mongoose');
const Recome   = require('../models/recomeco');

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/PlataformaAFM';   // ← ajuste o nome do DB aqui

async function seedRecomecos() {
  // 1) Conecta
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser:    true,
    useUnifiedTopology: true
  });
  console.log('✅ MongoDB conectado em', MONGODB_URI);

  // 2) Lê o JSON
  const JSON_PATH = path.join(__dirname, '../data/recomeços.json');
  if (!fs.existsSync(JSON_PATH)) {
    throw new Error('Não encontrei ' + JSON_PATH);
  }
  const dados = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

  // 3) Limpa e insere
  await Recome.deleteMany({});
  console.log('🗑️  coleção recomecos limpa');
  const inserted = await Recome.insertMany(dados);
  console.log(`🌱 Seed de ${inserted.length} recomeços concluída.`);

  // 4) Desconecta
  await mongoose.disconnect();
  process.exit(0);
}

seedRecomecos().catch(err => {
  console.error('❌ Seed falhou:', err);
  process.exit(1);
});
