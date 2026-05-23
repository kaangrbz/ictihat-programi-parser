# İçtihat Parser

## Parser Explorer

Detaylı inceleme arayüzü: arama, filtreler, tablolar, satır önizlemesi, parametre rehberi.

```bash
pnpm install
pnpm dev
```

Tarayıcı: [http://localhost:5173/explorer.html](http://localhost:5173/explorer.html)

Production:

```bash
pnpm build && pnpm start
# http://localhost:8102/explorer.html
```

### Özellikler

- Örnek metinler (test + index.html KYB metni)
- Genel arama (kavram, taraf, kanun)
- Filtreler: nihai karar, mahkeme, kanun no, min. flag güveni
- Sekmeler: Özet, Mevzuat (tablo), Hukuki mantık (flag tablosu), Taraflar, Ham JSON
- Tablo satırına tıklayınca kaynak metinde satır önizlemesi
- Sağ panel: API alan rehberi (şema 1.1.0)
- JSON indir

### API

```http
POST /api/analyze
Content-Type: application/json

{ "text": "karar metni veya HTML" }
```

### Diğer sayfalar

| Sayfa | Açıklama |
|-------|----------|
| `index.html` | Klasik badge görünümü |
| `explorer.html` | Detaylı explorer |
| `law-parser.html` | Kanun metni ağaç yapısı |
