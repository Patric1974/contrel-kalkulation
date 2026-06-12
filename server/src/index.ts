import express from 'express';
import cors from 'cors';
import path from 'path';
import calculationsRouter from './routes/calculations';
import marketSearchRouter from './routes/marketSearch';
import marketResearchRouter from './routes/marketResearch';
import db from './db/database';
import type { CalculationRow } from './types';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

// Middleware
const isProduction = process.env.NODE_ENV === 'production';
if (!isProduction) {
  app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
}
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api/calculations', calculationsRouter);
app.use('/api/market-search', marketSearchRouter);
app.use('/api/market-research', marketResearchRouter);

// Public share route - read only
app.get('/share/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM calculations WHERE id = ?').get(req.params.id) as CalculationRow | undefined;

    if (!row) {
      res.status(404).json({ error: 'Calculation not found' });
      return;
    }

    const data = JSON.parse(row.data);

    res.json({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      sessionId: row.session_id,
      articles: data.articles ?? [],
    });
  } catch (err) {
    console.error('Error getting shared calculation:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// In production: serve built React app
if (isProduction) {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Contrel server running on http://localhost:${PORT}`);
});

export default app;
