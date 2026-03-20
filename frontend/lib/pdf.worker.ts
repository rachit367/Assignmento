/// <reference lib="webworker" />
import jsPDF from 'jspdf'

interface PageData {
  dataUrl: string
  imgH: number
}

interface WorkerInput {
  pages: PageData[]
  contentW: number
  marginMM: number
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { pages, contentW, marginMM } = e.data
  try {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    for (let i = 0; i < pages.length; i++) {
      const { dataUrl, imgH } = pages[i]
      if (i > 0) pdf.addPage()
      pdf.addImage(dataUrl, 'PNG', marginMM, marginMM, contentW, imgH)
    }
    const blob = pdf.output('blob')
    self.postMessage({ success: true, blob })
  } catch (err) {
    self.postMessage({ success: false, error: String(err) })
  }
}

export {}
