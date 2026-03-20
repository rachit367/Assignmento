import html2canvas from 'html2canvas'

// A4 dimensions in mm
const PAGE_W_MM = 210
const PAGE_H_MM = 297
const MARGIN_MM = 12          // uniform margin on all 4 sides
const MIN_SECTION_GAP_MM = 20 // push item to next page if less than this remains at bottom

interface PDFOptions {
  /** CSS selector for elements to hide before capture (e.g. answer key for questions-only) */
  hideSelector?: string
}

/** Yield to the browser so it can paint UI updates (e.g. "Preparing..." state) */
const yieldToMain = () => new Promise<void>((r) => setTimeout(r, 0))

export async function downloadAsPDF(
  elementId: string,
  filename: string,
  options?: PDFOptions
): Promise<{ success: boolean; error?: string }> {
  const element = document.getElementById(elementId)
  if (!element) return { success: false, error: 'Element not found' }

  // 1. Hide requested elements (e.g. answer key)
  const hiddenEls: HTMLElement[] = []
  if (options?.hideSelector) {
    element.querySelectorAll<HTMLElement>(options.hideSelector).forEach((el) => {
      hiddenEls.push(el)
      el.style.display = 'none'
    })
  }

  // 2. Snapshot styles, then apply clean-capture overrides
  const savedCss = element.style.cssText
  element.style.boxShadow = 'none'
  element.style.borderRadius = '0'
  element.style.margin = '0'

  // 3. Wait for fonts so text renders crisply
  await document.fonts.ready

  // 4. Measure all break candidates: direct children (sections) + individual question items
  const rootRect = element.getBoundingClientRect()
  const directChildOffsets = Array.from(element.children).map(
    (c) => (c as HTMLElement).getBoundingClientRect().top - rootRect.top
  )
  const questionItemOffsets = Array.from(
    element.querySelectorAll<HTMLElement>('.question-item')
  ).map((el) => el.getBoundingClientRect().top - rootRect.top)

  // Deduplicate and sort all candidate cut points
  const sectionOffsets = [...new Set([...directChildOffsets, ...questionItemOffsets])].sort(
    (a, b) => a - b
  )

  try {
    // 5. Capture the element as a high-res canvas (must run on main thread — needs DOM)
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      // Capture full scrollable height, not just the visible viewport
      height: element.scrollHeight,
      windowHeight: element.scrollHeight,
    })

    // 6. Restore element immediately after capture
    element.style.cssText = savedCss
    hiddenEls.forEach((el) => (el.style.display = ''))

    // ── Geometry ─────────────────────────────────────────────────────────────
    const contentW  = PAGE_W_MM - MARGIN_MM * 2   // printable width  in mm
    const contentH  = PAGE_H_MM - MARGIN_MM * 2   // printable height in mm

    // How many canvas pixels fit in one printable page height
    const pxPerMm     = canvas.width / contentW           // canvas px per mm
    const pageSlicePx = contentH * pxPerMm               // canvas px per page
    const minGapPx    = MIN_SECTION_GAP_MM * pxPerMm     // orphan threshold

    // Section starts in canvas-pixel coordinates
    const scaleRatio    = canvas.width / rootRect.width   // screen px → canvas px
    const sectionStarts = sectionOffsets.map((y) => y * scaleRatio)

    // ── Build page slices ────────────────────────────────────────────────────
    const pageBounds: Array<{ y: number; h: number }> = []
    let cursor = 0

    while (cursor < canvas.height) {
      let sliceH = Math.min(pageSlicePx, canvas.height - cursor)

      // If this is not the last page, avoid orphaning a section header
      if (cursor + sliceH < canvas.height) {
        const cutAt  = cursor + sliceH
        const orphan = sectionStarts.find((sy) => sy > cutAt - minGapPx && sy < cutAt)
        if (orphan !== undefined) {
          sliceH = Math.max(1, orphan - cursor - 2)
        }
      }

      pageBounds.push({ y: cursor, h: sliceH })
      cursor += sliceH
    }

    // ── Build page dataUrls on the main thread (canvas access required) ──────
    // Yield every few pages so the browser stays responsive for multi-page PDFs.
    const pageData: Array<{ dataUrl: string; imgH: number }> = []
    for (let i = 0; i < pageBounds.length; i++) {
      if (i > 0 && i % 3 === 0) await yieldToMain()

      const { y: sliceY, h: sliceH } = pageBounds[i]

      const pageCanvas    = document.createElement('canvas')
      pageCanvas.width    = canvas.width
      pageCanvas.height   = Math.ceil(sliceH)

      const ctx = pageCanvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
      ctx.drawImage(canvas, 0, sliceY, canvas.width, sliceH, 0, 0, canvas.width, sliceH)

      const imgH = (sliceH / canvas.width) * contentW
      pageData.push({ dataUrl: pageCanvas.toDataURL('image/png'), imgH })
    }

    // ── Offload jsPDF assembly to a Web Worker so the main thread is free ────
    const blob = await assemblePDFInWorker(pageData, contentW, MARGIN_MM)

    // ── Trigger download ─────────────────────────────────────────────────────
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'question-paper.pdf'
    a.click()
    URL.revokeObjectURL(url)

    return { success: true }
  } catch (err) {
    // Always restore styles even on failure
    element.style.cssText = savedCss
    hiddenEls.forEach((el) => (el.style.display = ''))
    console.error('PDF generation error:', err)
    return { success: false, error: 'Could not generate PDF. Please try again.' }
  }
}

function assemblePDFInWorker(
  pages: Array<{ dataUrl: string; imgH: number }>,
  contentW: number,
  marginMM: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./pdf.worker.ts', import.meta.url))
    worker.onmessage = (e: MessageEvent<{ success: boolean; blob?: Blob; error?: string }>) => {
      worker.terminate()
      if (e.data.success && e.data.blob) {
        resolve(e.data.blob)
      } else {
        reject(new Error(e.data.error ?? 'PDF worker failed'))
      }
    }
    worker.onerror = (err) => {
      worker.terminate()
      reject(err)
    }
    worker.postMessage({ pages, contentW, marginMM })
  })
}
