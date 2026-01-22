/**
 * Dictionary Loader Module
 * Legal dictionary JSON dosyasını yükler ve işler
 */
import { setLegalDictionary } from './config.js';

const SENTIMENT_DATA = {
  teknik: ["kanun", "madde", "usul", "esas", "hüküm", "fıkra", "bent", "mevzuat", "içtihat"],
  sert: ["ceza", "hapis", "ağırlaştırılmış", "zorla", "ihlal", "suç", "kasıt", "kusur"],
  aciklayici: ["dolayısıyla", "nedeniyle", "gereğince", "binaen", "açıklanan", "hükmün", "gerekçeli"],
  kesin: ["karar verildi", "kesinleşmiş", "onama", "red", "kabul", "hüküm kuruldu"]
};

export async function loadDictionary() {
  const statusEl = document.getElementById("loader_status");
  const btn = document.getElementById("btn_analyze");
  
  try {
    // legal-dictionary.json dosyasını fetch ile yükle
    const response = await fetch('legal-dictionary.json');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const rawData = await response.json();
    
    // Veriyi KeywordProcessor'ın anlayacağı DÜZ LİSTE formatına çevir
    const flatDictionary = Object.values(rawData).flat();

    const dictionary = {
      dictionary: flatDictionary,
      rawCategories: rawData,
      sentiment_indicators: SENTIMENT_DATA
    };
    
    setLegalDictionary(dictionary);
    
    statusEl.textContent = "Sözlük Hazır ✓";
    statusEl.style.color = "var(--success)";
    btn.disabled = false;

  } catch (error) {
    console.error("Sözlük yükleme hatası:", error);
    statusEl.textContent = "Sözlük yüklenemedi, fallback kullanılıyor";
    statusEl.style.color = "var(--warning)";
    
    // Fallback: Boş sözlük ile devam et
    setLegalDictionary({
      dictionary: [],
      rawCategories: {},
      sentiment_indicators: SENTIMENT_DATA
    });
    
    btn.disabled = false;
  }
}
