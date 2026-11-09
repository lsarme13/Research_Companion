import { createApp } from './app.js';
import { DATA_DIR, HOST, PORT, PUBLIC_DIR, PROJECT_ROOT } from './config.js';

const app = await createApp({ dataDir: DATA_DIR, publicDir: PUBLIC_DIR });

const server = app.listen(PORT, HOST, () => {
  console.log('');
  console.log('  Research Companion');
  console.log(`  Interface: http://${HOST}:${PORT}`);
  console.log(`  Dados:     ${DATA_DIR}`);
  console.log(`  Projeto:   ${PROJECT_ROOT}`);
  console.log('');
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `A porta ${PORT} já está em uso. Encerre o outro processo ou defina outra porta com a variável PORT.`,
    );
  } else {
    console.error('Não foi possível iniciar o servidor:', error);
  }
  process.exitCode = 1;
});
