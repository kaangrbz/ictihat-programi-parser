/**
 * LawProcessor Unit Tests
 */
import { LawProcessor } from '../js/law-processor.js';

describe('LawProcessor', () => {
  describe('parse', () => {
    test('normal kanun referansını parse eder', () => {
      const text = '5237 S. TÜRK CEZA KANUNU Madde 124';
      const result = LawProcessor.parse(text);
      expect(result.length).toBe(1);
      expect(result[0].lawNo).toBe('5237');
      expect(result[0].lawName).toBe('TÜRK CEZA KANUNU');
      expect(result[0].maddeler.length).toBe(1);
      expect(result[0].maddeler[0].no).toBe('124');
    });

    test('köşeli parantez formatını parse eder', () => {
      const text = '5237 S. TÜRK CEZA KANUNU [ Madde 124 ]';
      const result = LawProcessor.parse(text);
      expect(result.length).toBe(1);
      expect(result[0].lawName).toBe('TÜRK CEZA KANUNU');
      expect(result[0].maddeler[0].no).toBe('124');
    });

    test('mülga kanunu köşeli parantez formatında parse eder', () => {
      const text = '765 S. TÜRK CEZA KANUNU (MÜLGA) [ Madde 491 ]';
      const result = LawProcessor.parse(text);
      expect(result.length).toBe(1);
      expect(result[0].lawNo).toBe('765');
      expect(result[0].lawName).toBe('TÜRK CEZA KANUNU');
      expect(result[0].isMulga).toBe(true);
      expect(result[0].mulgaInfo).toBe('MÜLGA');
      expect(result[0].maddeler.length).toBe(1);
      expect(result[0].maddeler[0].no).toBe('491');
      expect(result[0].maddeler[0].baglam).toContain('765 S. TÜRK CEZA KANUNU');
      expect(result[0].maddeler[0].baglam).toContain('Madde 491');
    });

    test('mülga kanunun birden fazla maddesini parse eder', () => {
      const text = `765 S. TÜRK CEZA KANUNU (MÜLGA) [ Madde 491 ]
765 S. TÜRK CEZA KANUNU (MÜLGA) [ Madde 493 ]
765 S. TÜRK CEZA KANUNU (MÜLGA) [ Madde 522 ]
765 S. TÜRK CEZA KANUNU (MÜLGA) [ Madde 55 ]`;
      const result = LawProcessor.parse(text);
      expect(result.length).toBe(1);
      expect(result[0].lawNo).toBe('765');
      expect(result[0].lawName).toBe('TÜRK CEZA KANUNU');
      expect(result[0].isMulga).toBe(true);
      expect(result[0].mulgaInfo).toBe('MÜLGA');
      expect(result[0].maddeler.length).toBe(4);
      expect(result[0].maddeler.map(m => m.no)).toEqual(['491', '493', '522', '55']);
    });

    test('mülga kanunu normal formatında parse eder', () => {
      const text = '765 S. TÜRK CEZA KANUNU (MÜLGA) Madde 491';
      const result = LawProcessor.parse(text);
      expect(result.length).toBe(1);
      expect(result[0].lawNo).toBe('765');
      expect(result[0].lawName).toBe('TÜRK CEZA KANUNU');
      expect(result[0].isMulga).toBe(true);
      expect(result[0].mulgaInfo).toBe('MÜLGA');
      expect(result[0].maddeler[0].no).toBe('491');
    });

    test('mülga ve normal kanunları birlikte parse eder', () => {
      const text = `5237 S. TÜRK CEZA KANUNU [ Madde 124 ]
765 S. TÜRK CEZA KANUNU (MÜLGA) [ Madde 491 ]
5271 S. CEZA MUHAKEMESİ KANUNU [ Madde 309 ]`;
      const result = LawProcessor.parse(text);
      expect(result.length).toBe(3);
      
      // Normal kanun
      expect(result[0].lawNo).toBe('5237');
      expect(result[0].isMulga).toBe(false);
      expect(result[0].mulgaInfo).toBe(null);
      
      // Mülga kanun
      expect(result[1].lawNo).toBe('765');
      expect(result[1].isMulga).toBe(true);
      expect(result[1].mulgaInfo).toBe('MÜLGA');
      
      // Normal kanun
      expect(result[2].lawNo).toBe('5271');
      expect(result[2].isMulga).toBe(false);
    });

    test('mülga kanunun satır numarasını ve içeriğini saklar', () => {
      const text = `Satır 1
765 S. TÜRK CEZA KANUNU (MÜLGA) [ Madde 491 ]
Satır 3
765 S. TÜRK CEZA KANUNU (MÜLGA) [ Madde 493 ]`;
      const result = LawProcessor.parse(text);
      expect(result[0].maddeler[0].satirNo).toBe(2);
      expect(result[0].maddeler[0].satirIcerigi).toContain('765 S. TÜRK CEZA KANUNU (MÜLGA)');
      expect(result[0].maddeler[1].satirNo).toBe(4);
      expect(result[0].maddeler[1].satirIcerigi).toContain('Madde 493');
    });

    test('mülga kanunun baglam alanını doğru oluşturur', () => {
      const text = '765 S. TÜRK CEZA KANUNU (MÜLGA) [ Madde 491 ]';
      const result = LawProcessor.parse(text);
      expect(result[0].maddeler[0].baglam).toBe('765 S. TÜRK CEZA KANUNU (MÜLGA) [ Madde 491 ]');
      expect(result[0].maddeler[0].satirIcerigi).toBe('765 S. TÜRK CEZA KANUNU (MÜLGA) [ Madde 491 ]');
    });

    test('farklı mülga kanunları ayrı parse eder', () => {
      const text = `765 S. TÜRK CEZA KANUNU (MÜLGA) [ Madde 491 ]
765 S. TÜRK CEZA KANUNU (MÜLGA) [ Madde 493 ]
5237 S. TÜRK CEZA KANUNU [ Madde 124 ]`;
      const result = LawProcessor.parse(text);
      expect(result.length).toBe(2);
      
      // Mülga kanun
      expect(result[0].lawNo).toBe('765');
      expect(result[0].isMulga).toBe(true);
      expect(result[0].maddeler.length).toBe(2);
      
      // Normal kanun
      expect(result[1].lawNo).toBe('5237');
      expect(result[1].isMulga).toBe(false);
      expect(result[1].maddeler.length).toBe(1);
    });

    test('kısa kanun referansını parse eder', () => {
      const text = 'TCK m.124';
      const result = LawProcessor.parse(text);
      expect(result.length).toBe(1);
      expect(result[0].lawName).toBe('TCK');
      expect(result[0].maddeler[0].no).toBe('124');
    });

    test('çoklu kanun referansını parse eder', () => {
      const text = `5237 S. TÜRK CEZA KANUNU [ Madde 124 ]
5271 S. CEZA MUHAKEMESİ KANUNU [ Madde 309 ]`;
      const result = LawProcessor.parse(text);
      expect(result.length).toBe(2);
      expect(result[0].lawNo).toBe('5237');
      expect(result[1].lawNo).toBe('5271');
    });

    test('aynı kanunun farklı maddelerini birleştirir', () => {
      const text = `5237 S. TÜRK CEZA KANUNU [ Madde 124 ]
5237 S. TÜRK CEZA KANUNU [ Madde 125 ]`;
      const result = LawProcessor.parse(text);
      expect(result.length).toBe(1);
      expect(result[0].maddeler.length).toBe(2);
      expect(result[0].maddeler.map(m => m.no)).toContain('124');
      expect(result[0].maddeler.map(m => m.no)).toContain('125');
    });

    test('satır numarasını saklar', () => {
      const text = `Satır 1
5237 S. TÜRK CEZA KANUNU [ Madde 124 ]
Satır 3`;
      const result = LawProcessor.parse(text);
      expect(result[0].maddeler[0].satirNo).toBe(2);
    });

    test('satır içeriğini saklar', () => {
      const text = '5237 S. TÜRK CEZA KANUNU [ Madde 124 ]';
      const result = LawProcessor.parse(text);
      expect(result[0].maddeler[0].satirIcerigi).toContain('TÜRK CEZA KANUNU');
    });

    test('madde numarası olmayan kanun referansını parse eder', () => {
      const text = '5237 S. TÜRK CEZA KANUNU';
      const result = LawProcessor.parse(text);
      expect(result.length).toBe(1);
      expect(result[0].lawName).toBe('TÜRK CEZA KANUNU');
      expect(result[0].maddeler.length).toBe(0);
    });

    test('boş metin için boş array döner', () => {
      const result = LawProcessor.parse('');
      expect(result).toEqual([]);
    });
  });

  describe('addLaw', () => {
    test('yeni kanun ekler', () => {
      const laws = [];
      LawProcessor.addLaw(laws, '5237', 'TÜRK CEZA KANUNU', '124', 'test', 1, null);
      expect(laws.length).toBe(1);
      expect(laws[0].lawNo).toBe('5237');
    });

    test('mevcut kanuna madde ekler', () => {
      const laws = [];
      LawProcessor.addLaw(laws, '5237', 'TÜRK CEZA KANUNU', '124', 'test', 1, null);
      LawProcessor.addLaw(laws, '5237', 'TÜRK CEZA KANUNU', '125', 'test', 2, null);
      expect(laws.length).toBe(1);
      expect(laws[0].maddeler.length).toBe(2);
    });

    test('duplicate madde eklemez', () => {
      const laws = [];
      LawProcessor.addLaw(laws, '5237', 'TÜRK CEZA KANUNU', '124', 'test', 1, null);
      LawProcessor.addLaw(laws, '5237', 'TÜRK CEZA KANUNU', '124', 'test', 1, null);
      expect(laws[0].maddeler.length).toBe(1);
    });
  });
});
