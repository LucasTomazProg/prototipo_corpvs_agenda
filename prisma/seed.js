require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main(){
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@exemplo.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

  await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      nome: 'Administrador',
      email: adminEmail,
      senhaHash: await bcrypt.hash(adminPass, 10),
      role: 'ADM'
    }
  });

  const tecnicos = [
    { nome:'Samuel Almeida', email:'samuel.almeida@corpvs.com.br', tel:'5585998164543' },
    { nome:'Iury Gomes', email:'iury.gomes@corpvs.com.br', tel:'5585986248161' }
  ];
  for(const t of tecnicos){
    await prisma.usuario.upsert({
      where: { email: t.email },
      update: {},
      create: {
        nome: t.nome, email: t.email,
        senhaHash: await bcrypt.hash('tecnico123', 10),
        role: 'TECNICO', telefone: t.tel
      }
    });
  }

  const clientes = [];
  const servicos = ['Instalação','Manutenção','Re-instalação','Retirada','Vistoria'];
  for(const nome of clientes){ await prisma.cliente.upsert({ where: { nome }, update: {}, create: { nome } }); }
  for(const nome of servicos){ await prisma.servico.upsert({ where: { nome }, update: {}, create: { nome } }); }

  console.log('Seed concluído.');
}
main().catch(e=>{ console.error(e); process.exit(1); }).finally(()=> prisma.$disconnect());