import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { cellText, xlsxToText } from "./xlsxToText";

describe("cellText", () => {
  it("returns an empty string for null or undefined", () => {
    expect(cellText(null)).toBe("");
    expect(cellText(undefined)).toBe("");
  });

  it("formats a Date as an ISO date", () => {
    expect(cellText(new Date(Date.UTC(2026, 6, 4)))).toBe("2026-07-04");
  });

  it("passes through plain numbers and strings", () => {
    expect(cellText(42.5)).toBe("42.5");
    expect(cellText("Comcast")).toBe("Comcast");
  });

  it("unwraps a formula's cached result", () => {
    expect(cellText({ formula: "A1+A2", result: 130 } as unknown as ExcelJS.CellValue)).toBe("130");
  });

  it("unwraps a hyperlink's display text", () => {
    expect(
      cellText({ text: "Pay now", hyperlink: "https://example.com" } as unknown as ExcelJS.CellValue),
    ).toBe("Pay now");
  });

  it("joins rich text runs", () => {
    expect(
      cellText({
        richText: [{ text: "Rent " }, { text: "(due)" }],
      } as unknown as ExcelJS.CellValue),
    ).toBe("Rent (due)");
  });

  it("falls back to an empty string for an unrecognized object shape", () => {
    expect(cellText({ unknown: "shape" } as unknown as ExcelJS.CellValue)).toBe("");
  });
});

describe("xlsxToText", () => {
  it("renders sheet names and comma-joined row values", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Bills");
    sheet.addRow(["Name", "Amount", "Due"]);
    sheet.addRow(["Rent", 1500, new Date(Date.UTC(2026, 6, 1))]);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const text = await xlsxToText(buffer);

    expect(text).toContain("--- Sheet: Bills ---");
    expect(text).toContain("Name, Amount, Due");
    expect(text).toContain("Rent, 1500, 2026-07-01");
  });
});
