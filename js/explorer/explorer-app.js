import {
  SCHEMA_VERSION,
  FLAG_LABELS,
  NIHAI_SONUC_LABELS,
  SAMPLE_TEXTS,
  PARAM_GROUPS
} from './schema-meta.js';

const state = {
  sourceText: '',
  result: null,
  loading: false,
  activeTab: 'overview',
  preview: null,
  filters: {
    query: '',
    nihaiSonuc: '',
    minConfidence: 0,
    lawNo: '',
    mahkeme: ''
  }
};

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatPct01(value) {
  if (typeof value !== 'number') {
    return '—';
  }

  return `${Math.round(value * 100)}%`;
}

function formatPct100(value) {
  if (typeof value !== 'number') {
    return '—';
  }

  return `${value}`;
}

function getSourceLines() {
  return state.sourceText.split(/\r?\n/);
}

function showLinePreview(lineNo, satirIcerigi, label) {
  if (!lineNo && !satirIcerigi) {
    state.preview = null;
    renderPreview();
    return;
  }

  const lines = getSourceLines();
  const idx = typeof lineNo === 'number' ? lineNo - 1 : -1;
  const contextBefore = idx > 0 ? lines[idx - 1] : '';
  const contextLine = idx >= 0 ? lines[idx] : (satirIcerigi ?? '');
  const contextAfter = idx >= 0 && idx < lines.length - 1 ? lines[idx + 1] : '';

  state.preview = {
    label: label ?? `Satır ${lineNo ?? '?'}`,
    lineNo,
    contextBefore,
    contextLine: contextLine || satirIcerigi || '',
    contextAfter,
    satirIcerigi
  };

  renderPreview();
}

function renderPreview() {
  const box = $('preview-box');

  if (!box) {
    return;
  }

  if (!state.preview) {
    box.innerHTML = '<p class="empty-state">Satır önizlemesi için tablodaki bir satıra tıklayın.</p>';
    return;
  }

  const p = state.preview;
  const lineNum = p.lineNo ?? '—';

  const beforeBlock = p.contextBefore
    ? `<div>${escapeHtml(p.contextBefore)}</div>`
    : '';
  const afterBlock = p.contextAfter
    ? `<div>${escapeHtml(p.contextAfter)}</div>`
    : '';

  box.innerHTML = `
    <h4>${escapeHtml(p.label)} · satır ${lineNum}</h4>
    <div class="preview-line">${beforeBlock}<div><mark>${escapeHtml(p.contextLine)}</mark></div>${afterBlock}</div>
  `;
}

function matchesQuery(text) {
  const q = state.filters.query.trim().toLowerCase();

  if (!q) {
    return true;
  }

  return String(text ?? '').toLowerCase().includes(q);
}

function passesNihaiFilter() {
  const filter = state.filters.nihaiSonuc;

  if (!filter) {
    return true;
  }

  const sonuc = state.result?.hukukiMantik?.nihaiKarar?.sonuc;

  return sonuc === filter;
}

function passesMahkemeFilter() {
  const filter = state.filters.mahkeme.trim().toLowerCase();

  if (!filter) {
    return true;
  }

  const mahkeme = state.result?.kimlik?.mahkeme ?? '';

  return String(mahkeme).toLowerCase().includes(filter);
}

function initSamples() {
  const select = $('sample-select');

  if (!select) {
    return;
  }

  SAMPLE_TEXTS.forEach((sample) => {
    const opt = document.createElement('option');
    opt.value = sample.id;
    opt.textContent = sample.label;
    select.appendChild(opt);
  });
}

function loadSample(sampleId) {
  const sample = SAMPLE_TEXTS.find((item) => item.id === sampleId);

  if (!sample) {
    return;
  }

  if (sample.text) {
    $('input-text').value = sample.text;
    state.sourceText = sample.text;
    return;
  }

  if (sample.id === 'kyb') {
    fetch('index.html')
      .then((res) => res.text())
      .then((html) => {
        const match = html.match(/<textarea[^>]*id="input"[^>]*>([\s\S]*?)<\/textarea>/i);

        if (match) {
          const text = match[1].trim();
          $('input-text').value = text;
          state.sourceText = text;
        }
      })
      .catch(() => {
        $('status-text').textContent = 'Örnek metin yüklenemedi.';
      });
  }
}

async function runAnalyze() {
  const text = $('input-text').value.trim();
  state.sourceText = text;

  if (!text) {
    $('status-text').textContent = 'Metin girin.';
    $('status-text').className = 'status-bar error';
    return;
  }

  const btn = $('btn-analyze');
  const status = $('status-text');
  btn.disabled = true;
  status.textContent = 'Analiz ediliyor...';
  status.className = 'status-bar';
  state.loading = true;

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || data.detail || `HTTP ${res.status}`);
    }

    state.result = data;
    status.textContent = `Tamam · şema ${data.schemaVersion ?? '?'}`;
    renderAll();
  } catch (error) {
    state.result = null;
    status.textContent = error.message;
    status.className = 'status-bar error';
    renderAll();
  } finally {
    btn.disabled = false;
    state.loading = false;
  }
}

function renderStats() {
  const el = $('stats-row');
  const data = state.result;

  if (!data) {
    el.innerHTML = '';
    return;
  }

  const cards = [
    { label: 'Şema', value: data.schemaVersion ?? '—' },
    { label: 'Kelime', value: data.istatistikler?.kelime ?? '—' },
    { label: 'Karmaşıklık', value: data.istatistikler?.karmasiklik ?? '—' },
    { label: 'Kalite', value: data.kaliteSinyali?.seviye ?? '—' },
    {
      label: 'Nihai karar',
      value: NIHAI_SONUC_LABELS[data.hukukiMantik?.nihaiKarar?.sonuc] ?? '—'
    },
    { label: 'Mevzuat', value: String(data.mevzuat?.length ?? 0) },
    { label: 'Kavram', value: String(data.kavramlar?.length ?? 0) }
  ];

  el.innerHTML = cards
    .map(
      (card) => `
      <div class="stat-card">
        <div class="label">${escapeHtml(card.label)}</div>
        <div class="value">${escapeHtml(String(card.value))}</div>
      </div>`
    )
    .join('');
}

function renderOverview() {
  const el = $('tab-overview');
  const data = state.result;

  if (!data) {
    el.innerHTML = '<p class="empty-state">Analiz sonucu yok. Soldan metin girip Analiz Et\'e basın.</p>';
    return;
  }

  if (!passesNihaiFilter() || !passesMahkemeFilter()) {
    el.innerHTML = '<p class="empty-state">Filtrelere uyan sonuç yok.</p>';
    return;
  }

  const kimlik = data.kimlik ?? {};
  const kalite = data.kaliteSinyali ?? {};
  const logic = data.hukukiMantik ?? {};

  el.innerHTML = `
    <dl class="kv-grid">
      <dt>Mahkeme</dt><dd>${escapeHtml(kimlik.mahkeme ?? '—')}</dd>
      <dt>Daire</dt><dd>${escapeHtml(kimlik.daire ?? '—')}</dd>
      <dt>Esas</dt><dd>${escapeHtml(kimlik.esas ?? '—')}</dd>
      <dt>Karar</dt><dd>${escapeHtml(kimlik.karar ?? '—')}</dd>
      <dt>Tarih</dt><dd>${escapeHtml(kimlik.tarih ?? '—')}</dd>
      <dt>Konu</dt><dd>${escapeHtml(kimlik.konu ?? '—')}</dd>
      <dt>Nihai sonuç</dt><dd>${escapeHtml(NIHAI_SONUC_LABELS[logic.nihaiKarar?.sonuc] ?? '—')} (${formatPct01(logic.nihaiKarar?.confidence)})</dd>
      <dt>finalDecision</dt><dd>${escapeHtml(logic.finalDecision ?? '—')}</dd>
      <dt>Güven (mantık)</dt><dd>${escapeHtml(logic.confidenceLevel ?? '—')} · ${logic.confidenceScore ?? '—'}</dd>
      <dt>Kalite</dt><dd>${escapeHtml(kalite.seviye ?? '—')} · puan ${kalite.puan ?? '—'}</dd>
      <dt>Analiz tarihi</dt><dd>${escapeHtml(data.analizTarihi ?? '—')}</dd>
    </dl>
    <h4 style="margin-top:20px;font-size:0.8rem;color:var(--muted)">Suç adları</h4>
    <div class="chip-list">${renderSuçChips(kimlik.suçAdları)}</div>
    <h4 style="font-size:0.8rem;color:var(--muted)">Kavramlar (ilk 20)</h4>
    <div class="chip-list">${renderKavramChips((data.kavramlar ?? []).slice(0, 20))}</div>
  `;
}

function renderSuçChips(list) {
  if (!list || list.length === 0) {
    return '<span class="chip muted">—</span>';
  }

  return list
    .filter((item) => matchesQuery(item))
    .map((item) => `<span class="chip">${escapeHtml(item)}</span>`)
    .join('');
}

function renderKavramChips(list) {
  if (!list || list.length === 0) {
    return '<span class="chip muted">—</span>';
  }

  return list
    .filter((item) => matchesQuery(item))
    .map((item) => `<span class="chip">${escapeHtml(item)}</span>`)
    .join('');
}

function renderMevzuat() {
  const el = $('tab-mevzuat');
  const data = state.result;

  if (!data?.mevzuat?.length) {
    el.innerHTML = '<p class="empty-state">Mevzuat atfı yok.</p>';
    return;
  }

  const lawFilter = state.filters.lawNo.trim();
  const rows = [];

  data.mevzuat.forEach((law) => {
    if (lawFilter && !String(law.lawNo ?? '').includes(lawFilter)) {
      return;
    }

    (law.maddeler ?? []).forEach((madde) => {
      const rowText = `${law.lawName} ${madde.no} ${madde.baglam}`;
      if (!matchesQuery(rowText)) {
        return;
      }

      rows.push({
        lawNo: law.lawNo,
        lawName: law.lawName,
        mulga: law.isMulga ? 'Evet' : 'Hayır',
        madde: madde.no,
        satirNo: madde.satirNo,
        baglam: (madde.baglam ?? '').slice(0, 80),
        satirIcerigi: madde.satirIcerigi
      });
    });
  });

  if (rows.length === 0) {
    el.innerHTML = '<p class="empty-state">Filtreye uyan mevzuat yok.</p>';
    return;
  }

  el.innerHTML = `
    <table class="data-table" id="mevzuat-table">
      <thead><tr><th>Kanun</th><th>Ad</th><th>Madde</th><th>Satır</th><th>Bağlam</th></tr></thead>
      <tbody>${rows.map((row, index) => `
        <tr class="clickable" data-mevzuat-row="${index}">
          <td>${escapeHtml(row.lawNo ?? '')}</td>
          <td>${escapeHtml(row.lawName ?? '')}${row.mulga === 'Evet' ? ' <span class="badge warn">MÜLGA</span>' : ''}</td>
          <td>${escapeHtml(row.madde ?? '')}</td>
          <td>${row.satirNo ?? '—'}</td>
          <td>${escapeHtml(row.baglam)}</td>
        </tr>`).join('')}</tbody>
    </table>
  `;

  el.querySelectorAll('[data-mevzuat-row]').forEach((tr) => {
    tr.addEventListener('click', () => {
      const index = Number.parseInt(tr.dataset.mevzuatRow, 10);
      const row = rows[index];
      showLinePreview(row.satirNo, row.satirIcerigi, `Mevzuat m.${row.madde}`);
    });
  });
}

function renderLogic() {
  const el = $('tab-logic');
  const logic = state.result?.hukukiMantik;

  if (!logic) {
    el.innerHTML = '<p class="empty-state">Hukuki mantık yok.</p>';
    return;
  }

  const minConf = Number(state.filters.minConfidence) || 0;
  const rows = Object.entries(logic.details ?? {})
    .map(([key, detail]) => ({
      key,
      label: FLAG_LABELS[key] ?? key,
      found: logic.rawFlags?.[key] === true,
      active: logic.flags?.[key] === true,
      confidence: detail?.confidence,
      lineNo: detail?.lineNo,
      matchReason: detail?.matchReason,
      suppressed: detail?.suppressedByPriority,
      satirIcerigi: detail?.satirIcerigi,
      context: (detail?.context ?? '').slice(0, 100)
    }))
    .filter((row) => {
      if ((row.confidence ?? 0) < minConf) {
        return false;
      }

      return matchesQuery(`${row.label} ${row.key} ${row.context}`);
    });

  el.innerHTML = `
    <p><strong>Nihai:</strong> ${escapeHtml(NIHAI_SONUC_LABELS[logic.nihaiKarar?.sonuc] ?? '—')}
      · ${formatPct01(logic.nihaiKarar?.confidence)} · finalDecision: ${escapeHtml(logic.finalDecision ?? '—')}</p>
    <table class="data-table" id="logic-table">
      <thead><tr><th>Flag</th><th>Ham</th><th>Aktif</th><th>Güven</th><th>Satır</th><th>Sebep</th></tr></thead>
      <tbody>${rows.map((row, index) => `
        <tr class="clickable" data-logic-row="${index}">
          <td>${escapeHtml(row.label)}</td>
          <td>${row.found ? '<span class="badge ok">✓</span>' : '—'}</td>
          <td>${row.active ? '<span class="badge ok">✓</span>' : row.suppressed ? '<span class="badge warn">baskı</span>' : '—'}</td>
          <td>${formatPct100(row.confidence)}</td>
          <td>${row.lineNo ?? '—'}</td>
          <td>${escapeHtml(row.matchReason ?? '')}</td>
        </tr>`).join('')}</tbody>
    </table>
  `;

  el.querySelectorAll('[data-logic-row]').forEach((tr) => {
    tr.addEventListener('click', () => {
      const index = Number.parseInt(tr.dataset.logicRow, 10);
      const row = rows[index];
      showLinePreview(row.lineNo, row.satirIcerigi, row.label);
    });
  });
}

function renderParties() {
  const el = $('tab-parties');
  const taraflar = state.result?.taraflar;

  if (!taraflar) {
    el.innerHTML = '<p class="empty-state">Taraf verisi yok.</p>';
    return;
  }

  const groups = [
    { key: 'davacilar', label: 'Davacı' },
    { key: 'davalilar', label: 'Davalı' },
    { key: 'saniklar', label: 'Sanık' },
    { key: 'mustekiler', label: 'Müşteki' },
    { key: 'mudahiller', label: 'Müdahil' },
    { key: 'vekiller', label: 'Vekil' },
    { key: 'talepler', label: 'Talep', isTalep: true }
  ];

  const rows = [];

  groups.forEach(({ key, label, isTalep }) => {
    const list = taraflar[key];

    if (!Array.isArray(list)) {
      return;
    }

    list.forEach((item) => {
      const name = isTalep ? (item.icerik ?? item.tip) : item.isim;
      if (!matchesQuery(`${label} ${name}`)) {
        return;
      }

      rows.push({
        role: label,
        name: name ?? '—',
        tip: item.tip,
        confidence: item.confidence,
        satirNo: item.satirNo,
        kaynak: item.kaynak,
        satirIcerigi: item.satirIcerigi
      });
    });
  });

  if (rows.length === 0) {
    el.innerHTML = '<p class="empty-state">Filtreye uyan taraf yok.</p>';
    return;
  }

  el.innerHTML = `
    <table class="data-table">
      <thead><tr><th>Rol</th><th>İsim / içerik</th><th>Güven</th><th>Satır</th><th>Kaynak</th></tr></thead>
      <tbody>${rows.map((row, index) => `
        <tr class="clickable" data-party-row="${index}">
          <td>${escapeHtml(row.role)}</td>
          <td>${escapeHtml(String(row.name).slice(0, 60))}</td>
          <td>${formatPct100(row.confidence)}</td>
          <td>${row.satirNo ?? '—'}</td>
          <td>${escapeHtml(row.kaynak ?? '—')}</td>
        </tr>`).join('')}</tbody>
    </table>
  `;

  el.querySelectorAll('[data-party-row]').forEach((tr) => {
    tr.addEventListener('click', () => {
      const index = Number.parseInt(tr.dataset.partyRow, 10);
      const row = rows[index];
      showLinePreview(row.satirNo, row.satirIcerigi, `${row.role}: ${row.name}`);
    });
  });
}

function renderJson() {
  const el = $('tab-json');

  if (!state.result) {
    el.innerHTML = '<p class="empty-state">JSON yok.</p>';
    return;
  }

  el.innerHTML = `<pre class="json-pre">${escapeHtml(JSON.stringify(state.result, null, 2))}</pre>`;
}

function renderParams() {
  const el = $('params-panel');

  el.innerHTML = PARAM_GROUPS.map((group) => `
    <div class="param-group">
      <h4>${escapeHtml(group.title)}</h4>
      ${group.fields.map((field) => `
        <div class="param-field"><code>${escapeHtml(field.key)}</code> · ${escapeHtml(field.type)} ${field.desc ? '— ' + escapeHtml(field.desc) : ''}</div>
      `).join('')}
    </div>
  `).join('');
}

function renderTabs() {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === state.activeTab);
  });

  document.querySelectorAll('.tab-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `tab-${state.activeTab}`);
  });
}

function renderAll() {
  renderStats();
  renderOverview();
  renderMevzuat();
  renderLogic();
  renderParties();
  renderJson();
  renderPreview();
}

function initTabs() {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      state.activeTab = tab.dataset.tab;
      renderTabs();
    });
  });
}

function initFilters() {
  $('filter-query').addEventListener('input', (event) => {
    state.filters.query = event.target.value;
    renderAll();
  });

  $('filter-nihai').addEventListener('change', (event) => {
    state.filters.nihaiSonuc = event.target.value;
    renderAll();
  });

  $('filter-law').addEventListener('input', (event) => {
    state.filters.lawNo = event.target.value;
    renderMevzuat();
  });

  $('filter-mahkeme').addEventListener('input', (event) => {
    state.filters.mahkeme = event.target.value;
    renderOverview();
  });

  $('filter-confidence').addEventListener('input', (event) => {
    state.filters.minConfidence = Number.parseInt(event.target.value, 10) || 0;
    renderLogic();
  });
}

function initNihaiOptions() {
  const select = $('filter-nihai');
  const first = document.createElement('option');
  first.value = '';
  first.textContent = 'Tümü';
  select.appendChild(first);

  Object.entries(NIHAI_SONUC_LABELS).forEach(([value, label]) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    select.appendChild(opt);
  });
}

function exportJson() {
  if (!state.result) {
    return;
  }

  const blob = new Blob([JSON.stringify(state.result, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `parser-analiz-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function init() {
  renderParams();
  initSamples();
  initNihaiOptions();
  initTabs();
  initFilters();
  renderAll();

  $('btn-analyze').addEventListener('click', runAnalyze);
  $('btn-clear').addEventListener('click', () => {
    $('input-text').value = '';
    state.sourceText = '';
    state.result = null;
    state.preview = null;
    $('status-text').textContent = 'Hazır';
    renderAll();
  });
  $('btn-export').addEventListener('click', exportJson);
  $('sample-select').addEventListener('change', (event) => {
    if (event.target.value) {
      loadSample(event.target.value);
    }
  });
  $('btn-load-sample').addEventListener('click', () => {
    const id = $('sample-select').value;
    if (id) {
      loadSample(id);
    }
  });

  $('status-text').textContent = `API hazır · şema ${SCHEMA_VERSION}`;
}

init();
