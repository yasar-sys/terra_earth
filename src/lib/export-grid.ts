export interface ExportCell {
  place: string;
  lat: number;
  lng: number;
  annual: Record<string, number>;
  trend?: { slope_per_decade: number; p_value: number; significant: boolean } | null;
}

export interface GridExport {
  variableLabel: string;
  variable: string;
  unit: string;
  datasetId: string;
  sourceUrl: string;
  retrieved: string;
  cells: ExportCell[];
}

function yearsOf(cells: ExportCell[]) {
  return [...new Set(cells.flatMap((c) => Object.keys(c.annual)))].map(Number).sort((a, b) => a - b);
}

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const q = (v: string) => `"${v.replace(/"/g, '""')}"`;

export function exportGridCsv(data: GridExport, filename: string) {
  const years = yearsOf(data.cells);
  const lines = [
    `# ${data.variableLabel} (${data.unit})`,
    `# Dataset: ${data.datasetId}`,
    `# Source: ${data.sourceUrl}`,
    `# Retrieved: ${data.retrieved}`,
    ["nearest_district", "lat", "lng", ...years.map(String), "theil_sen_per_decade", "mann_kendall_p", "significant_0_05"].join(","),
    ...data.cells.map((c) =>
      [
        q(c.place),
        c.lat,
        c.lng,
        ...years.map((y) => c.annual[String(y)] ?? ""),
        c.trend ? c.trend.slope_per_decade.toFixed(4) : "",
        c.trend ? c.trend.p_value.toFixed(4) : "",
        c.trend ? String(c.trend.significant) : "",
      ].join(","),
    ),
  ];
  save(new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" }), filename);
}

export async function exportGridPdf(data: GridExport, filename: string) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const ascii = (s: string) => s.replace(/[^\x20-\x7E]/g, "");
  let y = 14;
  pdf.setFontSize(14);
  pdf.text(ascii(`TerraBangla - ${data.variableLabel} (${data.unit})`), 10, y);
  pdf.setFontSize(8);
  for (const line of [
    `Dataset: ${data.datasetId}`,
    `Source: ${data.sourceUrl}`,
    `Retrieved: ${data.retrieved}  |  Cells: ${data.cells.length}  |  MEC TERRA_DETECTORS`,
  ]) {
    y += 5;
    pdf.text(pdf.splitTextToSize(ascii(line), 277)[0], 10, y);
  }
  y += 8;
  const cols = [55, 22, 22, 35, 35, 35, 35, 38];
  const head = ["Nearest district", "Lat", "Lng", "First year", "Last year", "Mean", "Trend/decade", "p (sig.)"];
  const drawRow = (vals: string[], bold = false) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    let x = 10;
    vals.forEach((v, i) => {
      pdf.text(v, x, y);
      x += cols[i]!;
    });
    y += 5;
  };
  drawRow(head, true);
  for (const c of data.cells) {
    if (y > 200) {
      pdf.addPage();
      y = 14;
      drawRow(head, true);
    }
    const ys = Object.keys(c.annual).map(Number).sort((a, b) => a - b);
    const vals = ys.map((k) => c.annual[String(k)]!);
    const mean = vals.reduce((s, v) => s + v, 0) / (vals.length || 1);
    const f = ys[0], l = ys[ys.length - 1];
    drawRow([
      ascii(c.place),
      c.lat.toFixed(2),
      c.lng.toFixed(2),
      f !== undefined ? `${f}: ${c.annual[String(f)]!.toFixed(3)}` : "-",
      l !== undefined ? `${l}: ${c.annual[String(l)]!.toFixed(3)}` : "-",
      mean.toFixed(3),
      c.trend ? c.trend.slope_per_decade.toFixed(4) : "-",
      c.trend ? `${c.trend.p_value.toFixed(4)}${c.trend.significant ? " *" : ""}` : "-",
    ]);
  }
  y += 3;
  pdf.setFontSize(7);
  pdf.text("* significant Mann-Kendall trend (p < 0.05). Values come only from cached NASA records; full annual series in the CSV export.", 10, Math.min(y, 205));
  pdf.save(filename);
}
