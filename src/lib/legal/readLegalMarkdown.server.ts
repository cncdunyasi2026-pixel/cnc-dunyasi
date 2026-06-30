import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

export type LegalDocumentKind = "kvkk" | "userAgreement";

const FILE_BY_KIND: Record<LegalDocumentKind, string> = {
  kvkk: "kvkk.md",
  userAgreement: "kullanici-sozlesmesi.md",
};

function stripTitleLine(markdown: string): { title: string; body: string } {
  const lines = markdown.replace(/^\uFEFF/, "").trimStart().split("\n");
  if (lines[0]?.startsWith("# ")) {
    return {
      title: lines[0].slice(2).trim(),
      body: lines.slice(1).join("\n").trim(),
    };
  }
  return { title: "", body: markdown.trim() };
}

export function readLegalMarkdown(kind: LegalDocumentKind): { title: string; body: string } {
  const filePath = join(process.cwd(), "content/legal", FILE_BY_KIND[kind]);
  const raw = readFileSync(filePath, "utf8");
  return stripTitleLine(raw);
}
