import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { LetterData } from '../types';

export const generatePdfLetter = async (data: LetterData): Promise<void> => {
  const originalElement = document.getElementById('printable-letter');
  if (!originalElement) {
    throw new Error('Element preview tidak ditemukan. Pastikan Anda berada di tab Preview.');
  }

  const paperDimensions = {
    a4: { w: '210mm', h: '297mm' },
    legal: { w: '216mm', h: '356mm' },
    letter: { w: '216mm', h: '279mm' }
  };
  const currentDim = paperDimensions[data.paperSize || 'a4'];

  try {
    // Wait a bit for visuals to settle
    await new Promise(resolve => setTimeout(resolve, 300));

    const canvas = await html2canvas(originalElement, {
      scale: 3, // Increased scale for sharp, high-quality prints
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        const clonedRoot = clonedDoc.getElementById('printable-letter');
        if (!clonedRoot) return;

        // Ensure all images are ready and using anonymous CORS
        const images = clonedRoot.querySelectorAll('img');
        images.forEach(img => {
          img.crossOrigin = 'anonymous';
        });

        // Force styles for the PDF rendering to be exactly like the paper dimensions
        Object.assign(clonedRoot.style, {
          transform: 'none',
          margin: '0',
          boxShadow: 'none',
          borderRadius: '0',
          border: 'none',
          width: currentDim.w,
          minHeight: currentDim.h,
          position: 'static',
          display: 'block',
          padding: '25mm' // Match the preview padding exactly
        });

        // REMOVE EDITABLE HINTS & UI ELEMENTS IN CLONE
        // Be careful not to remove essential study/cv icons which are SVGs
        const toRemove = clonedRoot.querySelectorAll('.no-print, button, [title], .opacity-0');
        toRemove.forEach(el => (el as HTMLElement).remove());

        // FIX FOR TAILWIND 4 OKLCH/OKLAB COLORS
        // html2canvas fails on modern color functions. We force resolve all styles to RGB.
        const allElements = clonedRoot.querySelectorAll('*');
        
        // Helper to convert any color string to RGB using the browser's own resolver
        const toRgb = (colorStr: string): string => {
          if (!colorStr || colorStr === 'transparent' || colorStr === 'rgba(0, 0, 0, 0)') return 'transparent';
          
          // If it's a CSS variable, we need to get its value
          if (colorStr.startsWith('var(')) {
            // This is tricky in a clone, but hopefully getComputedStyle already resolved it
            return colorStr; 
          }

          const temp = document.createElement('div');
          temp.style.color = colorStr;
          document.body.appendChild(temp);
          const resolved = window.getComputedStyle(temp).color;
          document.body.removeChild(temp);
          
          // Browsers usually resolve oklch/oklab to rgb() if oklch is not supported natively in the resolver or context,
          // but if it stays as oklch/oklab, we might need a manual fallback.
          if (resolved.includes('oklch') || resolved.includes('oklab')) {
             // Hardcoded fallbacks for the app's theme colors
             if (colorStr.includes('accent')) return '#2D5A27';
             if (colorStr.includes('ink')) return '#1A1A1A';
             if (colorStr.includes('paper')) return '#FFFFFF';
             if (colorStr.includes('bg')) return '#F5F5F0';
             return '#000000'; // Default fallback
          }
          return resolved;
        };

        allElements.forEach(el => {
          const htmlEl = el as HTMLElement;
          const style = window.getComputedStyle(htmlEl);
          
          const colorProps = ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'fill', 'stroke'] as const;
          
          colorProps.forEach(prop => {
            // @ts-ignore
            const val = style[prop];
            if (val && (val.includes('oklch') || val.includes('oklab') || val.includes('var('))) {
              htmlEl.style[prop] = toRgb(val);
            }
          });
          
          // Special fix for border-opacity or bg-opacity utilities in Tailwind
          // If the computed color is oklab/oklch, force it to its base hex
          if (style.color.includes('oklab') || style.color.includes('oklch')) htmlEl.style.color = '#1A1A1A';
          if (style.backgroundColor.includes('oklab') || style.backgroundColor.includes('oklch')) {
             if (htmlEl.classList.contains('bg-accent/5')) htmlEl.style.backgroundColor = 'rgba(45, 90, 39, 0.05)';
             else if (htmlEl.classList.contains('bg-ink/5')) htmlEl.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
             else htmlEl.style.backgroundColor = 'transparent';
          }
        });

        // Add a style tag to the cloned document to neutralize any remaining problematic CSS
        const styleTag = clonedDoc.createElement('style');
        styleTag.innerHTML = `
          * { 
            color-scheme: light !important;
            --color-accent: #2D5A27 !important;
            --color-ink: #1A1A1A !important;
            --color-paper: #FFFFFF !important;
            --color-bg: #F5F5F0 !important;
          }
          #printable-letter {
            background-color: #FFFFFF !important;
            color: #1A1A1A !important;
          }
          td, th { border-color: rgba(0,0,0,0.1) !important; }
        `;
        clonedDoc.head.appendChild(styleTag);
      }
    });

    // Use higher quality JPEG or PNG
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: data.paperSize || 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgProps = pdf.getImageProperties(imgData);
    const renderedImgHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // Tolerance for single page (sometimes subpixels cause a tiny overflow)
    const tolerance = 2; // 2mm tolerance
    
    if (renderedImgHeight <= pdfHeight + tolerance) {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, renderedImgHeight);
    } else {
      // Multi-page handling
      let heightLeft = renderedImgHeight;
      let position = 0;
      let pageNum = 1;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, renderedImgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = -(pdfHeight * pageNum);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, renderedImgHeight);
        heightLeft -= pdfHeight;
        pageNum++;
      }
    }

    const fileName = `${data.judulSurat || 'Surat'}_${data.nama || 'Tanpa Nama'}.pdf`;
    pdf.save(fileName.replace(/\s+/g, '_').toLowerCase());

  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error('Gagal membuat PDF. Silakan coba lagi atau gunakan fitur Cetak (Print to PDF).');
  }
};
