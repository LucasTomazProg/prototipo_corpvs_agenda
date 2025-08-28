// import-clientes.js
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Caminho para o CSV exportado do Google Planilhas
const csvPath = 'C:/Users/CORPVS/Documents/clientes.csv'; // ajuste se necessário

async function main() {
  const clientes = [];

  // Lê o CSV
  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      if (row.nome && row.nome.trim() !== '') {
        clientes.push(row.nome.trim());
      }
    })
    .on('end', async () => {
      console.log(`Total de clientes encontrados: ${clientes.length}`);

      // Importa para o banco
      for (const nome of clientes) {
        try {
          // Cria o cliente somente se ainda não existir
          await prisma.cliente.upsert({
            where: { nome },
            update: {}, // não atualiza nada se já existir
            create: { nome },
          });
          console.log(`✔ Cliente importado: ${nome}`);
        } catch (err) {
          console.error(`❌ Erro ao importar cliente: ${nome}`, err.message);
        }
      }

      console.log('Importação concluída!');
      await prisma.$disconnect();
    });
}

// Executa
main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
});
