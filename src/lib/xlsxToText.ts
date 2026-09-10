import ExcelJS from "exceljs";

// Cell values from ExcelJS can be primitives, Dates, or rich objects
// (formula results, hyperlinks, rich text runs) — normalize each to plain text.
export function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("result" in value && value.result != null) return String(value.result);
    if ("text" in value && value.text != null) return String(value.text);
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((run) => run.text ?? "").join("");
    }
    return "";
  }
  return String(value);
}

export async function xlsxToText(buffer: Buffer): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  // exceljs's bundled type declarations predate @types/node's generic Buffer<T>,
  // so a real Buffer instance still needs a cast to satisfy its exact shape.
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  const parts: string[] = [];
  workbook.eachSheet((worksheet) => {
    parts.push(`--- Sheet: ${worksheet.name} ---`);
    worksheet.eachRow((row) => {
      const values = (row.values as ExcelJS.CellValue[]).slice(1);
      parts.push(values.map(cellText).join(", "));
    });
  });
  return parts.join("\n");
}
