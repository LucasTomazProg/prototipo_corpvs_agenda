const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const { auth } = require('../middleware/auth');
function isEmail(s=''){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }
function sanitizeRole(r){ return r === 'ADM' ? 'ADM' : 'TECNICO'; }
router.get('/', auth('ADM'), async (req, res) => {
  const { q, role, ativo } = req.query; const where = {};
  if (q) where.OR = [{ nome:{ contains:q, mode:'insensitive'} }, { email:{ contains:q, mode:'insensitive'} }, { telefone:{ contains:q }}];
  if (role) where.role = sanitizeRole(role);
  if (typeof ativo !== 'undefined' && ativo !== '' ) where.ativo = String(ativo) === 'true';
  const users = await prisma.usuario.findMany({ where, orderBy:[{ role:'asc' }, { nome:'asc' }], select:{ id:true, nome:true, email:true, role:true, telefone:true, ativo:true, createdAt:true, updatedAt:true } });
  res.json(users);
});
router.post('/', auth('ADM'), async (req, res) => {
  try{
    const { nome, email, senha, role, telefone, ativo } = req.body;
    if(!nome || !email || !senha) return res.status(400).json({ error: 'Campos obrigatórios: nome, email, senha' });
    if(!isEmail(email)) return res.status(400).json({ error: 'Email inválido' });
    const exists = await prisma.usuario.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Já existe um usuário com este email' });
    const senhaHash = await bcrypt.hash(senha, 10);
    const novo = await prisma.usuario.create({ data: { nome, email, senhaHash, role: sanitizeRole(role), telefone: telefone || null, ativo: typeof ativo === 'boolean' ? ativo : true }, select: { id:true, nome:true, email:true, role:true, telefone:true, ativo:true, createdAt:true, updatedAt:true } });
    res.status(201).json(novo);
  }catch(e){ console.error(e); res.status(500).json({ error: 'Erro ao criar usuário' }); }
});
router.patch('/:id', auth('ADM'), async (req, res) => {
  try{
    const { id } = req.params; const { nome, email, senha, role, telefone, ativo } = req.body; const data = {};
    if (nome) data.nome = nome;
    if (email) { if(!isEmail(email)) return res.status(400).json({ error: 'Email inválido' }); data.email = email; }
    if (typeof role !== 'undefined') data.role = sanitizeRole(role);
    if (typeof telefone !== 'undefined') data.telefone = telefone || null;
    if (typeof ativo !== 'undefined') data.ativo = !!ativo;
    if (senha) data.senhaHash = await bcrypt.hash(senha, 10);
    const upd = await prisma.usuario.update({ where: { id }, data, select: { id:true, nome:true, email:true, role:true, telefone:true, ativo:true, createdAt:true, updatedAt:true } });
    res.json(upd);
  }catch(e){
    if (e.code === 'P2025') return res.status(404).json({ error: 'Usuário não encontrado' });
    if (e.code === 'P2002') return res.status(409).json({ error: 'Email já em uso por outro usuário' });
    console.error(e); res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});
router.post('/:id/status', auth('ADM'), async (req, res) => {
  try{
    const { id } = req.params; const { ativo } = req.body;
    const upd = await prisma.usuario.update({ where: { id }, data: { ativo: !!ativo }, select: { id:true, nome:true, email:true, role:true, telefone:true, ativo:true } });
    res.json(upd);
  }catch(e){
    if (e.code === 'P2025') return res.status(404).json({ error: 'Usuário não encontrado' });
    console.error(e); res.status(500).json({ error: 'Erro ao alterar status' });
  }
});
module.exports = router;