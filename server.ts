import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Serve static assets from dist
const distPath = path.resolve(__dirname, 'dist');
const altDistPath = path.resolve(__dirname, '..', 'dist');
const finalDistPath = fs.existsSync(distPath) ? distPath : altDistPath;

app.use(express.static(finalDistPath));

// Health check endpoint for Cloud Run
app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

// SPA fallback: any route not matching static files serves index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(finalDistPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
