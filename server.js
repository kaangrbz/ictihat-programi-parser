/**
 * Express API sunucusu
 * Karar metnini parametre alır, analiz sonucunu JSON döner.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { setLegalDictionary } from './js/config.js';
import { LegalAnalyzer } from './js/legal-analyzer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3002;
const isProduction = process.env.NODE_ENV === 'production';

const SENTIMENT_DATA = {
  teknik: ['kanun', 'madde', 'usul', 'esas', 'hüküm', 'fıkra', 'bent', 'mevzuat', 'içtihat'],
  sert: ['ceza', 'hapis', 'ağırlaştırılmış', 'zorla', 'ihlal', 'suç', 'kasıt', 'kusur'],
  aciklayici: ['dolayısıyla', 'nedeniyle', 'gereğince', 'binaen', 'açıklanan', 'hükmün', 'gerekçeli'],
  kesin: ['karar verildi', 'kesinleşmiş', 'onama', 'red', 'kabul', 'hüküm kuruldu']
};

function loadDictionary() {
  const jsonPath = path.join(__dirname, 'legal-dictionary.json');
  try {
    const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const flatDictionary = Object.values(rawData).flat();
    setLegalDictionary({
      dictionary: flatDictionary,
      rawCategories: rawData,
      sentiment_indicators: SENTIMENT_DATA
    });
    return true;
  } catch (err) {
    console.warn('Sözlük yüklenemedi, boş sözlük kullanılıyor:', err.message);
    setLegalDictionary({
      dictionary: [],
      rawCategories: {},
      sentiment_indicators: SENTIMENT_DATA
    });
    return false;
  }
}

loadDictionary();

const app = express();
app.use(express.json({ limit: '2mb' }));

// CORS: frontend farklı porttan (Vite dev) veya farklı origin'den istek atabilsin
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

/**
 * POST /api/analyze
 * Body: { "text": "karar metni..." }
 * Response: analiz JSON (kimlik, mevzuat, kavramlar, taraflar, istatistikler, hukukiMantik vb.)
 */
app.post('/api/analyze', (req, res) => {
  const text = req.body?.text;
  if (text == null || typeof text !== 'string') {
    return res.status(400).json({ error: 'Gönderim gerekli: { "text": "karar metni" }' });
  }
  try {
    const data = LegalAnalyzer.analyze(text);
    if (!data) {
      return res.status(400).json({ error: 'Metin boş veya analiz üretilemedi.' });
    }
    res.json(data);
  } catch (err) {
    console.error('Analiz hatası:', err);
    res.status(500).json({ error: 'Analiz sırasında hata oluştu.', detail: err.message });
  }
});

// Production: Vite build çıktısını statik olarak sun
if (isProduction) {
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const index = path.join(distPath, 'index.html');
      if (fs.existsSync(index)) res.sendFile(index);
      else res.status(404).send('Not found');
    });
  }
}

app.listen(PORT, () => {
  console.log(`API: http://localhost:${PORT}`);
  if (isProduction) console.log('Statik dosyalar: dist/');
});
