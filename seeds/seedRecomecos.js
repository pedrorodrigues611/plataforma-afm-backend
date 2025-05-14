// scripts/seedRecomecos.js

const fs   = require('fs');
const path = require('path');
const Recome = require('../models/Recomeco');

// caminho onde está o teu ficheiro JSON de recomeços
const JSON_PATH = path.join(__dirname, 'recomeços.json');

async function seedRecomecos() {
  let dados;

  if (fs.existsSync(JSON_PATH)) {
    // já geraste o JSON: só faz parse
    dados = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  } else {
    // se quiseres ler do PDF e gerar JSON on-the-fly,
    // poderias usar algo como pdf-parse aqui:
    //
    // const pdfParse = require('pdf-parse');
    // const buffer = fs.readFileSync(path.join(__dirname, 'recomeços.pdf'));
    // const { text } = await pdfParse(buffer);
    // dados = parseTextoParaRecomecos(text);
    // fs.writeFileSync(JSON_PATH, JSON.stringify(dados, null, 2));
    //
    throw new Error('Não existe recomeços.json — gera-o primeiro a partir do PDF');
  }

  for (const item of dados) {
    // assume que cada item tem os campos que o teu esquema espera
    await Recome.create(item);
  }

  console.log(`Seed de ${dados.length} recomeços concluída.`);
  process.exit();
}

seedRecomecos().catch(err => {
  console.error(err);
  process.exit(1);
});
