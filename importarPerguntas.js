const mongoose = require("mongoose");
const fs = require("fs");
require("dotenv").config();

const perguntaSchema = new mongoose.Schema({
  numero: Number,
  texto: String,
  opcoes: {
    A: String,
    B: String,
    C: String,
    D: String
  },
  correta: String
});

const Pergunta = mongoose.model("Pergunta", perguntaSchema);

async function importarPerguntas() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const data = JSON.parse(fs.readFileSync("perguntas_afm.json", "utf-8"));
    await Pergunta.deleteMany({});
    await Pergunta.insertMany(data);

    console.log(`✅ ${data.length} perguntas importadas com sucesso.`);
    process.exit(0);
  } catch (err) {
    console.error("Erro ao importar perguntas:", err);
    process.exit(1);
  }
}

importarPerguntas();