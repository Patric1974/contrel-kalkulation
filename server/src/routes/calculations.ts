import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import type { CalculationRow, CreateCalculationBody, UpdateCalculationBody } from '../types';

const router = Router();

// GET /api/calculations - list all calculations
router.get('/', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT
        id,
        name,
        created_at,
        updated_at,
        json_array_length(json_extract(data, '$.articles')) as article_count
      FROM calculations
      ORDER BY updated_at DESC
    `).all() as Array<{
      id: string;
      name: string;
      created_at: string;
      updated_at: string;
      article_count: number | null;
    }>;

    const result = rows.map(row => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      articleCount: row.article_count ?? 0,
    }));

    res.json(result);
  } catch (err) {
    console.error('Error listing calculations:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/calculations/:id - get full calculation
router.get('/:id', (req: Request, res: Response) => {
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
    console.error('Error getting calculation:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/calculations - create new calculation
router.post('/', (req: Request, res: Response) => {
  try {
    const body = req.body as CreateCalculationBody;

    if (!body.session_id) {
      res.status(400).json({ error: 'session_id is required' });
      return;
    }

    if (!body.name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const data = JSON.stringify({ articles: body.articles ?? [] });

    db.prepare(`
      INSERT INTO calculations (id, name, created_at, updated_at, session_id, data)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, body.name, now, now, body.session_id, data);

    res.status(201).json({
      id,
      name: body.name,
      createdAt: now,
      updatedAt: now,
      sessionId: body.session_id,
      articles: body.articles ?? [],
    });
  } catch (err) {
    console.error('Error creating calculation:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/calculations/:id - update calculation
router.put('/:id', (req: Request, res: Response) => {
  try {
    const body = req.body as UpdateCalculationBody;

    if (!body.session_id) {
      res.status(400).json({ error: 'session_id is required' });
      return;
    }

    const existing = db.prepare('SELECT * FROM calculations WHERE id = ?').get(req.params.id) as CalculationRow | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Calculation not found' });
      return;
    }

    if (existing.session_id !== body.session_id) {
      res.status(403).json({ error: 'Forbidden: session_id does not match' });
      return;
    }

    const now = new Date().toISOString();
    const name = body.name ?? existing.name;
    const existingData = JSON.parse(existing.data);
    const articles = body.articles !== undefined ? body.articles : existingData.articles;
    const data = JSON.stringify({ articles });

    db.prepare(`
      UPDATE calculations SET name = ?, updated_at = ?, data = ? WHERE id = ?
    `).run(name, now, data, req.params.id);

    res.json({
      id: existing.id,
      name,
      createdAt: existing.created_at,
      updatedAt: now,
      sessionId: existing.session_id,
      articles,
    });
  } catch (err) {
    console.error('Error updating calculation:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/calculations/:id - delete calculation
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const body = req.body as { session_id?: string };

    if (!body.session_id) {
      res.status(400).json({ error: 'session_id is required' });
      return;
    }

    const existing = db.prepare('SELECT * FROM calculations WHERE id = ?').get(req.params.id) as CalculationRow | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Calculation not found' });
      return;
    }

    if (existing.session_id !== body.session_id) {
      res.status(403).json({ error: 'Forbidden: session_id does not match' });
      return;
    }

    db.prepare('DELETE FROM calculations WHERE id = ?').run(req.params.id);

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting calculation:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
