import { app } from '../src/app';
import { connectDatabase } from '../src/database';
import { KnowledgeService } from '../src/services/knowledge/knowledgeService';

/**
 * Vercel Serverless Function entry point if apps/api is selected as the Root Directory.
 */
export default async function handler(req: any, res: any) {
  try {
    await connectDatabase();
    await KnowledgeService.ensureSeeded();
  } catch (err) {
    console.error('[Vercel Serverless] Startup error:', err);
  }

  return app(req, res);
}

export { app };
