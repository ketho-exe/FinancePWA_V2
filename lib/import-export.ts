import { WorkspaceSnapshot } from "@/lib/types";

export type ParsedImportRow = {
  date: string;
  description: string;
  amount: number;
  categoryName?: string;
  accountName?: string;
  notes?: string;
};

export function parseCsvText(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase());

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));

    return {
      date:
        record.date ||
        record.transaction_date ||
        record.posted_at ||
        new Date().toISOString().slice(0, 10),
      description: record.description || record.details || record.payee || "Imported transaction",
      amount: Number(record.amount || record.value || 0),
      categoryName: record.category || undefined,
      accountName: record.account || undefined,
      notes: record.notes || record.note || undefined,
    } satisfies ParsedImportRow;
  });
}

export function normalizeImportRows(rows: ParsedImportRow[], snapshot: WorkspaceSnapshot) {
  const firstAccount = snapshot.accounts[0];
  const incomeCategory = snapshot.categories.find((category) => category.kind === "income");
  const expenseCategory = snapshot.categories.find((category) => category.kind === "expense");

  return rows
    .filter((row) => row.description && row.amount !== 0)
    .map((row) => {
      const category =
        snapshot.categories.find(
          (item) => item.name.toLowerCase() === (row.categoryName ?? "").toLowerCase(),
        ) ?? (row.amount >= 0 ? incomeCategory : expenseCategory);
      const account =
        snapshot.accounts.find(
          (item) => item.name.toLowerCase() === (row.accountName ?? "").toLowerCase(),
        ) ?? firstAccount;

      return {
        date: row.date,
        description: row.description,
        amount: Math.abs(row.amount),
        categoryId: category?.id ?? "",
        accountId: account?.id,
        notes: row.notes,
      };
    })
    .filter((row) => row.categoryId);
}

export function buildBackupLabel() {
  const now = new Date();
  return `Backup ${now.toISOString().slice(0, 16).replace("T", " ")}`;
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}
