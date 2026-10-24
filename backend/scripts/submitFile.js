// Submits a static JSON observation file to a running backend's POST /monitor.
// Usage: npm run monitor:file -- [path/to/file.json]
// Optional env: MONITOR_API_URL (default http://localhost:5000),
//               MONITOR_TOKEN (a login token; without it the run is a guest run and nothing is saved).
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DEFAULT_FILE = fileURLToPath(new URL('../src/fixtures/api-responses.example.json', import.meta.url));
const DEFAULT_API_URL = 'http://localhost:5000';

async function main() {
  const filePath = process.argv[2] ?? DEFAULT_FILE;
  const apiUrl = (process.env.MONITOR_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, '');
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.MONITOR_TOKEN) headers.Authorization = `Bearer ${process.env.MONITOR_TOKEN}`;

  const body = await readFile(filePath, 'utf8');
  const response = await fetch(`${apiUrl}/monitor`, { method: 'POST', headers, body });
  console.log(`HTTP ${response.status}`);
  console.log(JSON.stringify(await response.json(), null, 2));
  if (!response.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`Submission failed: ${error.message}`);
  process.exitCode = 1;
});
