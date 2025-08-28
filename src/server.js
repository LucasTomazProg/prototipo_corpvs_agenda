require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));

// Static
app.use(express.static(path.join(__dirname, '..', 'public')));

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
app.set('prisma', prisma);

// Routes
app.use('/auth', require('./routes/auth.routes'));
app.use('/', require('./routes/options.routes'));
app.use('/atendimentos', require('./routes/atendimentos.routes'));
app.use('/usuarios', require('./routes/usuarios.routes'));

// Health
app.get('/health', (_, res)=> res.json({ ok:true }));

// Fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/auth') || req.path.startsWith('/atendimentos') || req.path.startsWith('/usuarios')) return res.status(404).end();
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log(`Server on http://localhost:${port}`));