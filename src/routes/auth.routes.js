const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if(!email || !senha) return res.status(400).json({ error: 'Informe email e senha' });
  const user = await prisma.usuario.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
  const ok = await bcrypt.compare(senha, user.senhaHash);
  if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '8h' });
  res.json({ token, user: { id: user.id, nome: user.nome, role: user.role } });
  console.log('Usuario encontrado:', user);
  console.log('Senha hash no banco:', user?.senhaHash);
});

module.exports = router;


