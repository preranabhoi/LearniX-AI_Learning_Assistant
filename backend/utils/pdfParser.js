import fs from "fs";
import { PDFParse } from "pdf-parse";

export const extractTextFromPDF = async (filePath) => {
  try {
    console.log("Reading PDF:", filePath);

    const buffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    const text = data?.text || (typeof data === "string" ? data : "");

    console.log("PDF TEXT LENGTH:", text.length);

    return text || "";
  } catch (error) {
    console.error("PDF ERROR:", error);
    throw error;
  }
};
