const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth } = require('../middleware/auth');

router.get('/options', auth(), async (req, res) => {
  const [clientes, servicos, tecnicos] = await Promise.all([
    prisma.cliente.findMany({ orderBy: { nome: 'asc' } }),
    prisma.servico.findMany({ orderBy: { nome: 'asc' } }),
    prisma.usuario.findMany({ where: { role: 'TECNICO', ativo: true }, orderBy: { nome: 'asc' } })
  ]);
  res.json({
    clientes: clientes.map(c => c.nome),
    servicos: servicos.map(s => s.nome),
    tecnicos: tecnicos.map(t => ({ id: t.id, nome: t.nome, telefone: t.telefone }))
  });
});

module.exports = router;