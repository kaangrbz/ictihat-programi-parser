# Test Kılavuzu

## Kurulum

```bash
yarn install
```

## Test Çalıştırma

Tüm testleri çalıştır:
```bash
yarn test
```

Watch modunda çalıştır (değişiklikleri otomatik test eder):
```bash
yarn test:watch
```

Coverage raporu ile çalıştır:
```bash
yarn test:coverage
```

## Test Dosyaları

- `__tests__/meta-processor.test.js` - MetaProcessor testleri (mahkeme, esas/karar, suç adları)
- `__tests__/law-processor.test.js` - LawProcessor testleri (kanun referansları, mülga kanunlar)
- `__tests__/legal-logic-processor.test.js` - Hukuki mantık kontrolleri testleri
- `__tests__/sentiment-processor.test.js` - Duygu analizi testleri
- `__tests__/stats-processor.test.js` - İstatistik hesaplama testleri
- `__tests__/keyword-processor.test.js` - Kavram çıkarma testleri
- `__tests__/legal-analyzer.test.js` - Ana analiz fonksiyonu testleri

## Test Kapsamı

### MetaProcessor
- ✅ Mahkeme adı parsing (Genel Kurul, Daire, Bölge Mahkemesi)
- ✅ Esas/Karar numarası parsing (tireli formatlar dahil: 2009/6-163 E.)
- ✅ Çoklu esas/karar numarası parsing
- ✅ Suç adları parsing (İçtihat Metni öncesindeki büyük harfli satırlar)
- ✅ Tarih parsing
- ✅ Daire parsing

### LawProcessor
- ✅ Normal kanun referansları (5237 S. TÜRK CEZA KANUNU Madde 124)
- ✅ Köşeli parantez formatı ([ Madde 124 ])
- ✅ Mülga kanunlar (765 S. TÜRK CEZA KANUNU (MÜLGA))
- ✅ Kısa kanun referansları (TCK m.124)
- ✅ Çoklu kanun referansları
- ✅ Aynı kanunun farklı maddelerini birleştirme
- ✅ Satır numarası ve içerik saklama

### LegalLogicProcessor
- ✅ HAGB kontrolü
- ✅ Bozma kontrolü
- ✅ Onama kontrolü
- ✅ Red kontrolü
- ✅ Kabul kontrolü
- ✅ Beraat kontrolü
- ✅ Zamanaşımı kontrolü
- ✅ Yetkisizlik kontrolü
- ✅ Görevsizlik kontrolü
- ✅ Derdestlik kontrolü
- ✅ Satır numarası ve bağlam bilgisi saklama

### SentimentProcessor
- ✅ Teknik ton tespiti
- ✅ Sert ton tespiti
- ✅ Açıklayıcı ton tespiti
- ✅ Kesin ton tespiti
- ✅ En yüksek skorlu ton belirleme
- ✅ Yazım stili belirleme (Akademik/Teknik vs Operasyonel)

### StatsProcessor
- ✅ Kelime sayısı hesaplama
- ✅ Kavram yoğunluğu hesaplama
- ✅ Okuma süresi hesaplama
- ✅ Karmaşıklık seviyesi belirleme

### KeywordProcessor
- ✅ Kavram bulma
- ✅ Çoklu kelimeli kavramlar
- ✅ Duplicate filtreleme
- ✅ Case-insensitive arama

### LegalAnalyzer
- ✅ Tüm analiz sonuçlarını birleştirme
- ✅ Boş metin kontrolü
- ✅ Analiz tarihi ekleme

## Test Örnekleri

### MetaProcessor Örneği
```javascript
const text = 'Ceza Genel Kurulu 2009/6-163 E., 2009/202 K.';
const result = MetaProcessor.extract(text);
expect(result.mahkeme).toContain('Ceza Genel Kurulu');
expect(result.esasList).toContain('2009/6-163');
```

### LawProcessor Örneği
```javascript
const text = '5237 S. TÜRK CEZA KANUNU [ Madde 124 ]';
const result = LawProcessor.parse(text);
expect(result[0].lawName).toBe('TÜRK CEZA KANUNU');
expect(result[0].maddeler[0].no).toBe('124');
```

### LegalLogicProcessor Örneği
```javascript
const text = 'Kararın bozulmasına karar verildi';
const result = LegalLogicProcessor.analyze(text);
expect(result.flags.is_bozma).toBe(true);
expect(result.details.is_bozma.lineNo).toBeDefined();
```

## Notlar

- Tüm testler ES6 modül sistemi kullanıyor
- Jest 30.2.0 ile `--experimental-vm-modules` flag'i kullanılıyor
- `package.json`'da `"type": "module"` olduğu için `extensionsToTreatAsEsm` gerekmiyor
- Test dosyaları `__tests__` klasöründe bulunuyor
