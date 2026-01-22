/**
 * Main Module
 * Uygulama başlangıcı ve event listener'lar
 */
import { loadDictionary } from './dictionary-loader.js';
import { runAnalysis, clearAll, copyJSON } from './ui-renderer.js';

// Sayfa yüklendiğinde sözlüğü yükle
window.onload = loadDictionary;

// Global fonksiyonlar (HTML'den çağrılabilmesi için)
window.runAnalysis = runAnalysis;
window.clearAll = clearAll;
window.copyJSON = copyJSON;
