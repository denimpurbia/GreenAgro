import { app } from './app';
import { config } from './config';
import { connectDatabase } from './database';
import { KnowledgeService } from './services/knowledge/knowledgeService';

const PORT = config.port;

async function bootstrap() {
  // connectDatabase() throws if USE_IN_MEMORY_DB=false and Atlas is unreachable.
  // That causes bootstrap() to reject → process.exit(1) below → server never starts.
  await connectDatabase();
  await KnowledgeService.ensureSeeded();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🌾 GreenAgro / AgriN Intelligence Network Backend`);
    console.log(`🚀 Server listening on 0.0.0.0:${PORT}`);
    console.log(`📡 Health: http://0.0.0.0:${PORT}/api/health`);
    console.log(`🤖 Gemini Model: ${config.geminiModel}`);
    console.log(`🌦️  Weather: ${config.weatherProvider}`);
    console.log(`🛰️  Satellite: ${config.satelliteProvider}`);
    console.log(`====================================================`);
  });
}

bootstrap().catch((err) => {
  console.error('');
  console.error('====================================================');
  console.error('💥 FATAL: Server failed to start.');
  console.error(`   Reason: ${err?.message || err}`);
  console.error('====================================================');
  console.error('');
  process.exit(1);
});
