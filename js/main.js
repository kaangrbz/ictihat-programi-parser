/**
 * Main Module
 * Uygulama başlangıcı ve event listener'lar (analiz API üzerinden yapılır)
 */
import { runAnalysis, clearAll, copyJSON } from './ui-renderer.js';

// Sayfa yüklendiğinde API hazır, butonu aç
window.onload = () => {
  const statusEl = document.getElementById('loader_status');
  const btn = document.getElementById('btn_analyze');
  if (statusEl) statusEl.textContent = 'Hazır ✓';
  if (btn) btn.disabled = false;
};

// Global fonksiyonlar (HTML'den çağrılabilmesi için)
window.runAnalysis = runAnalysis;
window.clearAll = clearAll;
window.copyJSON = copyJSON;
