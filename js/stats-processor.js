/**
 * Stats Processor Module
 * Metin istatistiklerini hesaplar
 */
export const StatsProcessor = {
  calculate(text, keywordCount) {
    const words = text.trim().split(/\s+/).length;
    const density = words > 0 ? ((keywordCount / words) * 100).toFixed(2) : 0;
    return {
      kelime: words,
      kavramYogunlugu: `%${density}`,
      okumaSuresi: Math.ceil(words / 150) + " dk",
      karmasiklik: words > 500 ? "Yüksek" : "Orta"
    };
  }
};
