/**
 * PDF Handler Module
 * PDF.js kullanarak PDF dosyalarından metin çıkarma
 */
import * as pdfjsLib from 'pdfjs-dist';

// PDF.js worker yapılandırması
// Worker path'i HTML'den ayarlanacak (window.PDFJS_WORKER_SRC)
// Eğer ayarlanmamışsa, import.meta.url ile relative path kullan
if (typeof window !== 'undefined' && window.PDFJS_WORKER_SRC) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = window.PDFJS_WORKER_SRC;
} else {
  try {
    // import.meta.url ile relative path
    const workerUrl = new URL('../node_modules/pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url);
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.href;
  } catch (error) {
    // Fallback: unpkg CDN kullan
    console.warn('Local worker yüklenemedi, CDN kullanılıyor:', error);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
}

export const PdfHandler = {
  /**
   * PDF dosyasından metin çıkarır
   * @param {File|ArrayBuffer|Uint8Array} fileInput - PDF dosyası
   * @returns {Promise<string>} Çıkarılan metin
   */
  async extractText(fileInput) {
    try {
      let arrayBuffer;
      
      // File objesi ise ArrayBuffer'a dönüştür
      if (fileInput instanceof File) {
        arrayBuffer = await fileInput.arrayBuffer();
      } else if (fileInput instanceof ArrayBuffer) {
        arrayBuffer = fileInput;
      } else if (fileInput instanceof Uint8Array) {
        arrayBuffer = fileInput.buffer;
      } else {
        throw new Error('Geçersiz dosya formatı');
      }

      // PDF dokümanını yükle
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      const numPages = pdf.numPages;

      // Her sayfayı işle
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Sayfa metnini birleştir
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
      }

      return fullText.trim();
    } catch (error) {
      console.error('PDF işleme hatası:', error);
      throw new Error(`PDF işlenirken hata oluştu: ${error.message}`);
    }
  },

  /**
   * Dosya yükleme ve metin çıkarma için yardımcı fonksiyon
   * @param {File} file - Yüklenen dosya
   * @returns {Promise<string>} Çıkarılan metin
   */
  async processFile(file) {
    if (!file) {
      throw new Error('Dosya seçilmedi');
    }

    // Dosya tipini kontrol et
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      return await this.extractText(file);
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      // Düz metin dosyası
      return await file.text();
    } else {
      throw new Error('Desteklenmeyen dosya formatı. PDF veya TXT dosyası yükleyin.');
    }
  }
};
