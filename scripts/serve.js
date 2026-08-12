// Sobe o servidor do sistema de controle de comissão.
// Uso: npm run comissao [-- --porta=3000]
import { abrirDb } from '../src/db.js';
import { criarServidor } from '../src/server.js';
import { parseArgs } from '../src/cliArgs.js';

const args = parseArgs(process.argv.slice(2));
const porta = Number(args.porta) || Number(process.env.PORT) || 3000;

const db = abrirDb();
const servidor = criarServidor(db);

servidor.listen(porta, () => {
  console.log(`Sistema de comissão rodando em http://localhost:${porta}`);
  console.log('Painéis: /metas.html (metas e faixas) e /lancamentos.html (lançar doações e ver comissão)');
});

for (const sinal of ['SIGINT', 'SIGTERM']) {
  process.on(sinal, () => {
    servidor.close(() => {
      db.close();
      process.exit(0);
    });
  });
}
