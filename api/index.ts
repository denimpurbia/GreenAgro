import { app } from '../apps/api/src/app';
import { connectDatabase } from '../apps/api/src/database';
import { KnowledgeService } from '../apps/api/src/services/knowledge/knowledgeService';

/**
 * Root Vercel Serverless Function entry point (/api).
 * In a monorepo deployment on Vercel, requests to /api/*
 * are routed to this serverless handler.
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
