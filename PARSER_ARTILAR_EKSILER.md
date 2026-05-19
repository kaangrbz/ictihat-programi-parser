# Parser — Artılar ve Eksiler

Bu belge, `parser/` klasöründeki **LegalAnalyzer** tabanlı içtihat analiz servisinin güçlü ve zayıf yönlerini özetler. Teknik detay için bkz. `PROJE_INCELEME_RAPORU.md`, testler için `README-TESTS.md`.

---

## Ne yapar?

Yargıtay (ve benzeri) karar metnini alır; kural tabanlı (regex + sözlük) işlemcilerle yapılandırılmış JSON üretir:

| Çıktı alanı | Modül | Örnek içerik |
|-------------|--------|----------------|
| `schemaVersion` | `schema.js` | API sözleşme sürümü (ör. `1.1.0`) |
| `kimlik` | `MetaProcessor` | Mahkeme, daire, esas/karar no, tarih, suç adları |
| `mevzuat` | `LawProcessor` | Kanun no, madde, mülga bilgisi, satır referansı |
| `hukukiMantik` | `LegalLogicProcessor` + `decision-finalizer` | Bayraklar, `rawFlags`, tek `nihaiKarar` |
| `kavramlar` | `KeywordProcessor` | `legal-dictionary.json` eşleşmeleri |
| `taraflar` | `PartyProcessor` | Davacı, davalı, sanık, müşteki, vekil, müdahil, talep |
| `istatistikler` | `StatsProcessor` | Kelime sayısı, yoğunluk, basit karmaşıklık |
| `kaliteSinyali` | `LegalAnalyzer` | Modüllerden türetilen genel güven özeti |

**Pipeline (sıra):** `normalizeLegalText` → kimlik → mevzuat → kavramlar → taraflar → hukuki mantık → `finalizeDecision` → istatistikler → kalite sinyali.

**API:** `POST /api/analyze` — gövde: `{ "text": "..." }`  
**Çalıştırma:** `yarn dev` (Vite UI + Express), Docker’da `parser:3002`, ana uygulama `PARSER_URL` ile proxy eder.

Analiz **isteğe bağlı** çalışır; sonuçlar varsayılan olarak veritabanına yazılmaz (önizleme / araştırma katmanı).

---

## Artılar

### 1. Deterministik ve hızlı

- Aynı metin → aynı JSON; model sürümü veya API anahtarı gerekmez.
- LLM’e göre gecikme düşük; tek karar için tipik süre milisaniye–saniye mertebesinde (metin boyutuna bağlı).
- Maliyet öngörülebilir (sadece sunucu CPU/RAM).

### 2. Modüler mimari

- Her alan ayrı dosyada (`meta-processor`, `law-processor`, `legal-logic-processor` …).
- Yeni kural veya sözlük girişi tek modülde geliştirilebilir; tam pipeline’ı yeniden yazmaya gerek yok.
- `LegalAnalyzer.analyze()` tek giriş noktası; entegrasyon basit.

### 3. Mevzuat çıkarımı güçlü

- Yargıtay formatına yakın satır kalıpları: `5237 S. TÜRK CEZA KANUNU Madde 124`, köşeli parantez ve **(MÜLGA)** ayrımı.
- Kısa atıflar (TCK, CMK, HMK …) desteklenir.
- Satır numarası ve ham satır metni saklanır → kullanıcı metinde doğrulama yapabilir.

### 4. Merkezi metin normalizasyonu

- `normalizeLegalText` tüm işlemcilerden önce çalışır; `<br>` / `</p>` satır sonuna çevrilir, etiketler kaldırılır, satır yapısı korunur.
- Ham HTML doğrudan regex’lere gitmez.

### 5. Hukuki mantık için bağlam ve tek nihai karar

- Her karar türü için `requiredContext` ile yanlış pozitif azaltma.
- `rawFlags` çoklu true tutulur; `finalizeDecision` sabit öncelikle **tek** `nihaiKarar` üretir (`bozma` > `kısmenBozma` > `onama` > …).
- Geriye uyumlu `finalDecision` (internal key) korunur.

### 6. Test altyapısı

- Jest ile modül bazlı unit testler (`__tests__/`).
- Regresyon için sabit fixture metinler kullanılabilir.
- CI’da kolay çalıştırılır (`yarn test`).

### 7. Bağımsız servis ve demo UI

- Express API + isteğe bağlı Vite statik arayüz (`index.html`).
- Docker imajı mevcut; monorepo içinde `api` → `parser` zinciri tanımlı.
- CORS açık; tarayıcıdan veya başka servisten doğrudan deneme imkânı.

### 8. Şeffaflık

- Kara kutu model yok; hangi regex / sözlük eşleştiği kodda görülür.
- Hukukçu veya geliştirici çıktıyı satır numarasıyla karşılaştırabilir.
- `kaliteSinyali` ile “bu analize ne kadar güvenilebilir?” sorusuna kaba cevap verilir.

### 9. Gizlilik ve veri egemenliği

- Metin üçüncü taraf LLM’e gönderilmez (kendi sunucunuzda kalır).
- KVKK / gizlilik açısından iç ağda barındırmaya uygun mimari.

---

## Eksiler ve sınırlamalar

### 1. Regex ve sözlük sınırı

- Doğal dilde serbest geçen ifadeler, yazım varyasyonları ve dolaylı anlatım zayıf kalır.
- `LawProcessor` çoğunlukla **satır başı formatına** bağlı; paragraf içi dağınık atıflar kaçabilir.
- `KeywordProcessor` kök/ek ayırmaz, eşanlam yok; sözlük bakımı kaliteyi doğrudan belirler (`legal-dictionary.json` küçük).

### 2. Taraf ve talep çıkarımı düşük doğruluk (uzun kararlarda)

- `PartyProcessor` “davacı:”, “davalı:” gibi kalıplara dayanır; Yargıtay’ın uzun, HTML’li, standart dışı metinlerinde sık sık **boş veya eksik** sonuç.
- Sanık / mağdur / müşteki gibi ceza terminolojisi ile hukuk davası rolleri karışabilir.
- Sektörel kullanımda en zayıf halka olarak değerlendirilmeli (bkz. inceleme raporu ~59/100).

### 3. Hukuki mantık: öncelik kuralı sınırları

- `rawFlags` hâlâ çoklu true gösterebilir; `nihaiKarar` sabit öncelik listesine bağlıdır (metnin gerçek nihai cümlesi değil).
- “kısmen boz” ifadesi tam `bozma` pattern’i ile de eşleşebilir (öncelik: tam bozma önce).
- “red” gibi kısa kelimeler bağlam dışı yanlış pozitif üretebilir.

### 4. Meta / kimlik hataları

- `MetaProcessor` regex ile mahkeme adını birleştirirken format dışı başlıklarda hatalı birleşim riski.
- İlk yakalanan esas/karar no kullanılır; çoklu dosya numaralarında tam liste her zaman anlamlı değil.
- Tarih tek kalıpla aranır; birden fazla tarihde hangisinin “karar tarihi” olduğu ayrışmaz.

### 5. Taraf çıkarımı hâlâ sınırlı

- Colon regex + 300 satır fallback iyileştirildi; uzun/karmaşık metinlerde recall artar, precision düşük kalabilir.
- Fallback düşük confidence (≈45) ile işaretlenir.

### 6. Duygu / ton analizi pasif

- `SentimentProcessor` kodda var; API çıktısında `duyguAnalizi: null`.
- Yarı pasif alan API sözleşmesini şişirir; tüketiciler için kafa karıştırıcı olabilir.

### 7. Üretim güvenliği eksikleri

- CORS `*` — kurumsal ortamda risk.
- Kimlik doğrulama, rate limit, istek audit log’u yok.
- JSON gövde limiti 2 MB; çok büyük kararlar veya kötü niyetli yükler için ek koruma gerekir.
- Yapılandırılmış log / metrik (süre, modül başarı oranı) sınırlı.

### 8. Kalıcı depolama

- Analiz sonucu DB’ye otomatik yazılmaz; tekrar analiz = tekrar işlem.
- `schemaVersion` eklendi; kural değişiminde sürüm takibi mümkün.

### 9. LLM tabanlı çözümlere göre

| Konu | Parser (kural tabanlı) | LLM / NLP |
|------|------------------------|-----------|
| Doğruluk (karmaşık anlatım) | Düşük–orta | Yüksek potansiyel, halüsinasyon riski |
| Maliyet | Düşük | Yüksek (token) |
| Tekrarlanabilirlik | Yüksek | Düşük (sıcaklık / model) |
| Denetlenebilirlik | Yüksek | Düşük |
| Bakım | Sözlük/regex güncelleme | Prompt + model sürümü |

---

## Özet tablo

| Boyut | Artı | Eksi |
|-------|------|------|
| Hız / maliyet | Çok iyi | — |
| Mevzuat atıfları | Çok iyi | Satır dışı atıflar zayıf |
| Karar türü bayrakları | İyi (bağlam + confidence) | Çoklu true, nadir false positive |
| Kimlik bilgisi | Orta–iyi | Format dışı metinlerde hata |
| Taraflar / talepler | Zayıf | Uzun kararlarda kritik eksik |
| Kavramlar | Orta | Sözlük bağımlı, statik |
| Güvenlik / ops | Zayıf (prod) | CORS, auth, gözlemlenebilirlik |
| Entegrasyon | Basit REST | Şema sürümü yok |

---

## Ne zaman yeterli, ne zaman değil?

**Yeterli olduğu durumlar**

- Karar önizlemesinde hızlı “etiketleme”: mevzuat listesi, olası karar türleri, anahtar kavramlar.
- Araştırma UI’sında kullanıcının metni kendisinin doğrulayacağı öneriler.
- Gizlilik gerektiren, dış API’ye metin göndermek istenmeyen ortamlar.
- Toplu işlemde düşük maliyetli ön filtre (sonra insan veya LLM).

**Yetersiz kaldığı durumlar**

- Otomatik karar özeti veya nihai hukuki sonuç çıkarımı (tek başına).
- Taraf listesi, vekil bilgisi veya talep metninin güvenilir çıkarımı.
- Mevzuatın paragraf içi serbest anlatımdaki tüm atıflarının eksiksiz envanteri.
- Yüksek hacimli, kimliksiz internete açık public API (ek güvenlik katmanı olmadan).

---

## İyileştirme öncelikleri (kısa)

1. `PartyProcessor` — ceza/hukuk rol kalıpları, HTML’siz girdi pipeline’ı, negatif filtreler.  
2. `LegalLogicProcessor` — nihai sonuç bölümü (SONUÇ / KARAR) önceliği, kısa kelime false positive azaltma.  
3. API — CORS kısıtı, rate limit, opsiyonel auth, `schemaVersion`.  
4. Benchmark — gerçek karar seti ile precision/recall (altın standart etiketli örnekler).  
5. Entegrasyon testleri — `POST /api/analyze` snapshot testleri.

Detaylı puanlama ve sprint planı: `PROJE_INCELEME_RAPORU.md`, `.cursor/plans/dogruluk-kesinlik-sprint-26958133.plan.md`.

---

*Son güncelleme: `schemaVersion` 1.1.0, `normalizeLegalText`, `finalizeDecision` / `nihaiKarar`, genişletilmiş `PartyProcessor` (sanık, müşteki, müdahil, fallback).*
