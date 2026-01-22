/**
 * UI Renderer Module
 * Analiz sonuçlarını UI'da gösterir
 */
import { LegalAnalyzer } from './legal-analyzer.js';

export function runAnalysis() {
  const input = document.getElementById("input").value;
  const data = LegalAnalyzer.analyze(input);
  if (!data) return;

  document.getElementById("output").textContent = JSON.stringify(data, null, 2);

  renderArea("stats_area", data.istatistikler);
  
  const sentArea = document.getElementById("sentiment_area");
  sentArea.innerHTML = `<span class="badge sentiment-badge"><span class="badge-label">Baskın Ton:</span><span class="badge-value">${data.duyguAnalizi.ton}</span></span>`;
  sentArea.innerHTML += `<span class="badge sentiment-badge"><span class="badge-label">Yazım Stili:</span><span class="badge-value">${data.duyguAnalizi.stil}</span></span>`;

  renderArea("meta_area", data.kimlik);

  // Suç Adları
  const sucAdlariArea = document.getElementById("suc_adlari_area");
  sucAdlariArea.innerHTML = "";
  if (data.kimlik.suçAdları && data.kimlik.suçAdları.length > 0) {
    data.kimlik.suçAdları.forEach(suç => {
      const span = document.createElement("span");
      span.className = "badge keyword-badge";
      span.innerHTML = suç;
      sucAdlariArea.appendChild(span);
    });
  } else {
    sucAdlariArea.innerHTML = "<span class='status-msg'>Suç adı bulunamadı.</span>";
  }

  const lawArea = document.getElementById("laws_area");
  lawArea.innerHTML = "";
  if(data.mevzuat.length === 0) lawArea.innerHTML = "<span class='status-msg'>Mevzuat atfı bulunamadı.</span>";
  
  data.mevzuat.forEach(l => {
    l.maddeler.forEach(m => {
      const span = document.createElement("span");
      span.className = "badge law-badge";
      let titleText = m.baglam || "";
      if (l.isMulga) {
        titleText += (titleText ? "\n" : "") + `Mülga: ${l.mulgaInfo || 'Mülga Kanun'}`;
      }
      if (m.satirNo) {
        titleText += (titleText ? "\n" : "") + `Satır: ${m.satirNo}`;
      }
      span.title = titleText;
      
      let lawName = l.lawName || 'Kanun';
      if (l.lawNo) {
        lawName = `${l.lawNo} S. ${lawName}`;
      }
      if (l.isMulga) {
        lawName += ` (MÜLGA)`;
      }
      
      span.innerHTML = `<strong>${lawName}</strong> m.${m.no}`;
      lawArea.appendChild(span);
    });
  });

  const keyArea = document.getElementById("keywords_area");
  keyArea.innerHTML = "";
  if(data.kavramlar.length === 0) keyArea.innerHTML = "<span class='status-msg'>Anahtar kavram bulunamadı.</span>";

  data.kavramlar.forEach(k => {
    keyArea.innerHTML += `<span class="badge keyword-badge">${k}</span>`;
  });

  // Hukuki Mantık Kontrolleri
  const logicArea = document.getElementById("legal_logic_area");
  logicArea.innerHTML = "";
  
  if (data.hukukiMantik && data.hukukiMantik.flags) {
    const flags = data.hukukiMantik.flags;
    const details = data.hukukiMantik.details;
    
    // Aktif flag'leri göster
    Object.entries(flags).forEach(([key, value]) => {
      if (value === true) {
        const detail = details[key];
        const span = document.createElement("span");
        span.className = "badge sentiment-badge";
        
        let titleText = `${key}: Bulundu`;
        if (detail && detail.context) {
          titleText += `\nBağlam: ${detail.context}`;
        }
        if (detail && detail.lineNo) {
          titleText += `\nSatır: ${detail.lineNo}`;
        }
        
        span.title = titleText;
        span.innerHTML = `<span class="badge-label">${key}:</span><span class="badge-value">✓</span>`;
        logicArea.appendChild(span);
      }
    });
    
    // Hiç aktif flag yoksa bilgi mesajı
    const activeFlags = Object.values(flags).filter(v => v === true);
    if (activeFlags.length === 0) {
      logicArea.innerHTML = "<span class='status-msg'>Hukuki mantık kontrolü sonucu bulunamadı.</span>";
    }
  } else {
    logicArea.innerHTML = "<span class='status-msg'>Hukuki mantık analizi yapılamadı.</span>";
  }
}

export function renderArea(id, obj) {
  const el = document.getElementById(id);
  el.innerHTML = "";
  Object.entries(obj).forEach(([k, v]) => {
    // null değerleri ve suçAdları array'ini atla (ayrı gösteriliyor)
    if (v === null || k === 'suçAdları' || (Array.isArray(v) && v.length === 0)) return;
    
    const span = document.createElement("span");
    span.className = "badge";
    
    // Array değerleri için özel gösterim
    let displayValue = v;
    if (Array.isArray(v)) {
      displayValue = v.join(', ');
    }
    
    span.innerHTML = `<span class="badge-label">${k}:</span><span class="badge-value">${displayValue}</span>`;
    el.appendChild(span);
  });
}

export function clearAll() {
  document.getElementById("input").value = "";
  document.getElementById("output").textContent = "// Bekliyor...";
  ["stats_area", "sentiment_area", "meta_area", "suc_adlari_area", "laws_area", "keywords_area", "legal_logic_area"].forEach(id => document.getElementById(id).innerHTML = "");
}

export function copyJSON() {
  const pre = document.getElementById("output");
  navigator.clipboard.writeText(pre.textContent);
  alert("JSON kopyalandı!");
}
