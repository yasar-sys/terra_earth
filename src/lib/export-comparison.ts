export async function exportComparisonPdf(element: HTMLElement, filename: string) {
  const [{ toJpeg }, { jsPDF }] = await Promise.all([
    import("html-to-image"),
    import("jspdf"),
  ]);
  element.classList.add("pdf-export");
  let image: string;
  try {
    image = await toJpeg(element, {
      backgroundColor: "#0B0E1A",
      pixelRatio: 1.6,
      quality: 0.92,
      cacheBust: true,
      skipFonts: true,
    });
  } finally {
    element.classList.remove("pdf-export");
  }
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  pdf.setProperties({
    title: "Bangladesh Trend Detective comparison",
    author: "MEC TERRA_DETECTORS",
    subject: "NASA data trend comparison",
  });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const imageWidth = pageWidth - margin * 2;
  const imageHeight = (element.scrollHeight * imageWidth) / element.scrollWidth;
  let offset = 0;
  while (offset < imageHeight) {
    if (offset > 0) pdf.addPage();
    pdf.addImage(image, "JPEG", margin, margin - offset, imageWidth, imageHeight, undefined, "FAST");
    offset += pageHeight - margin * 2;
  }
  pdf.save(filename);
}