const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth } = require('../middleware/auth');

router.post('/', auth('ADM'), async (req, res) => {
  try{
    const { data, periodo, clienteNome, servicoNome, tecnicoId, responsavel, endereco, obs } = req.body;
    if(!data || !periodo || !clienteNome || !servicoNome || !tecnicoId || !responsavel || !endereco){
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }
    const [cliente, servico] = await Promise.all([
      prisma.cliente.upsert({ where: { nome: clienteNome }, update: {}, create: { nome: clienteNome } }),
      prisma.servico.upsert({ where: { nome: servicoNome }, update: {}, create: { nome: servicoNome } })
    ]);
    const atendimento = await prisma.atendimento.create({
      data: {
        data: new Date(data),
        periodo, clienteId: cliente.id, servicoId: servico.id,
        tecnicoId, responsavel, endereco, obs: obs || null,
        criadoPorId: req.user.sub
      },
      include: { cliente: true, servico: true, tecnico: { select: { id: true, nome: true, telefone: true } } }
    });
    res.status(201).json(atendimento);
  }catch(e){
    console.error(e);
    res.status(500).json({ error: 'Erro ao criar atendimento' });
  }
});

router.get('/', auth(), async (req, res) => {
  const user = req.user;
  const where = user.role === 'TECNICO' ? { tecnicoId: user.sub } : {};
  const itens = await prisma.atendimento.findMany({
    where, orderBy: { criadoEm: 'desc' },
    include: { cliente: true, servico: true, tecnico: { select: { id: true, nome: true, telefone: true } } }
  });
  res.json(itens);
});

router.delete('/:id', auth('ADM'), async (req, res) => {
  await prisma.atendimento.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

module.exports = router;