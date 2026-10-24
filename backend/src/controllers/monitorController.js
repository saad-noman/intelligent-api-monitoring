// Thin HTTP handlers for monitoring. Detection, explanation, and persistence are
// coordinated by services/monitorService.js.
import { readFile } from 'node:fs/promises';
import { runMonitoring } from '../services/monitorService.js';
import { listRecords } from '../services/monitoringRecordService.js';

// The static sample batch (assignment input method "a"), served so the UI can load it.
const SAMPLE_FILE = new URL('../fixtures/api-responses.example.json', import.meta.url);

// POST /monitor (optionalAuth)
// Guest (req.user === null): results are returned but not persisted.
// Authenticated: results are persisted for req.user.id, never for a client-supplied ID.
export async function submitMonitoring(req, res) {
  const outcome = await runMonitoring(req.body, { ownerId: req.user?.id ?? null });
  res.json(outcome);
}

// GET /monitor/sample (public)
export async function getSampleBatch(req, res) {
  res.json(JSON.parse(await readFile(SAMPLE_FILE, 'utf8')));
}

// GET /monitor/records (requireAuth)
export async function listMonitoringRecords(req, res) {
  const records = await listRecords(req.user.id);
  res.json({ records, count: records.length });
}
