import { app } from './app';
import { connectDatabase } from './database';
import { KnowledgeService } from './services/knowledge/knowledgeService';

/**
 * Vercel Serverless Function entry point for apps/api.
 * Ensures MongoDB Atlas connection is active, seeds knowledge base on first invocation,
 * and delegates request handling directly to the Express application.
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
