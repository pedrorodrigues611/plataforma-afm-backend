const express = require('express');
const router = express.Router();
const RelatorioQuestao = require('../models/RelatorioQuestao');
const User = require('../models/User');
const { authMiddleware, requireAdmin } = require("../middleware/auth");

// Reportar questão (utilizador comum)
router.post('/reportar-questao', authMiddleware, async (req, res) => {
  try {
    const { numero, resposta } = req.body;
    
    if (!numero || !resposta) {
      return res.status(400).json({ message: 'Número da questão e resposta são obrigatórios.' });
    }

    const novoRelatorio = new RelatorioQuestao({
      numero,
      resposta,
      userId: req.user.id,
    });

    await novoRelatorio.save();
    res.status(201).json({ message: 'Relatório submetido com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao submeter relatório.' });
  }
});

// Ver todos os relatórios (admin)
router.get('/admin/relatorios', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const relatorios = await RelatorioQuestao.find({ aprovado: false }).populate('userId', 'name email');
    res.json(relatorios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar relatórios.' });
  }
});

// Aprovar relatório (admin)
router.patch('/admin/relatorios/:id/aprovar', [authMiddleware, requireAdmin], async (req, res) => {
  try {
    const relatorio = await RelatorioQuestao.findById(req.params.id);
    if (!relatorio) {
      return res.status(404).json({ message: 'Relatório não encontrado.' });
    }

    // Marca a questão como aprovada
    relatorio.aprovado = true;
    await relatorio.save();

    // Atualizar resultados dos utilizadores que erraram essa questão
    const todosRelatorios = await RelatorioQuestao.find({ numero: relatorio.numero, aprovado: false });

    // Atualiza a questão para correta para todos os utilizadores que erraram
    todosRelatorios.forEach(async (rel) => {
      rel.resposta = relatorio.resposta; // Marca a resposta correta
      await rel.save();
    });

    res.json({ message: 'Relatório aprovado com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao aprovar relatório.' });
  }
});

module.exports = router;
