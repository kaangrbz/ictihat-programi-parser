/**
 * StatsProcessor Unit Tests
 */
import { StatsProcessor } from '../js/stats-processor.js';

describe('StatsProcessor', () => {
  describe('calculate', () => {
    test('kelime sayısını hesaplar', () => {
      const text = 'Bu bir test metnidir';
      const result = StatsProcessor.calculate(text, 0);
      expect(result.kelime).toBe(4);
    });

    test('kavram yoğunluğunu hesaplar', () => {
      const text = 'Bu bir test metnidir';
      const result = StatsProcessor.calculate(text, 2);
      expect(result.kavramYogunlugu).toBe('%50.00');
    });

    test('okuma süresini hesaplar', () => {
      const text = 'Bu bir test metnidir. '.repeat(10); // ~150 kelime
      const result = StatsProcessor.calculate(text, 0);
      expect(result.okumaSuresi).toContain('dk');
    });

    test('yüksek karmaşıklık tespit eder', () => {
      const longText = 'kelime '.repeat(600);
      const result = StatsProcessor.calculate(longText, 0);
      expect(result.karmasiklik).toBe('Yüksek');
    });

    test('orta karmaşıklık tespit eder', () => {
      const text = 'kelime '.repeat(100);
      const result = StatsProcessor.calculate(text, 0);
      expect(result.karmasiklik).toBe('Orta');
    });

    test('boş metin için sıfır değerler döner', () => {
      const result = StatsProcessor.calculate('', 0);
      expect(result.kelime).toBe(0);
      expect(result.kavramYogunlugu).toBe('%0.00');
    });
  });
});
