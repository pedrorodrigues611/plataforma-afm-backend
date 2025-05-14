// backend/seeds/seedRecomecos.js

const Pergunta = require('../models/Pergunta');
const data = require('../data/recomeços.json');
require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser:    true,
    useUnifiedTopology: true,
  });
  console.log('Mongo conectado para seed');
  await Pergunta.deleteMany({ categoria: 'recomeco' }); // limpa seeds anteriores
  const docs = data.map(d => ({ ...d, categoria: 'recomeco' }));
  await Pergunta.insertMany(docs);
  console.log('Seed de Recomeços inserida:', docs.length);
  process.exit();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
