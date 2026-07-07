import { z } from "zod";
import { accountStore, billStore, debtStore, incomeStore } from "@/lib/storage";
import type { Account, Bill, Debt, Income } from "@/lib/types";

// Loose validation on import — enough to catch "wrong file picked" without
// duplicating every field of every model.
const EntityArray = z.array(z.object({ id: z.string() }).passthrough());

const BackupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  accounts: EntityArray,
  bills: EntityArray,
  debts: EntityArray,
  income: EntityArray,
});

export interface Backup {
  version: 1;
  exportedAt: string;
  accounts: Account[];
  bills: Bill[];
  debts: Debt[];
  income: Income[];
}

export function buildBackup(): Backup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    accounts: accountStore.getAll(),
    bills: billStore.getAll(),
    debts: debtStore.getAll(),
    income: incomeStore.getAll(),
  };
}

export function downloadBackup(): void {
  const backup = buildBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `mymoney-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function parseBackup(raw: string): Backup {
  // Validated loosely (shape + id presence) above; the rest of each entity's
  // fields are trusted to match since this only ever reads our own export format.
  return BackupSchema.parse(JSON.parse(raw)) as unknown as Backup;
}

export function restoreBackup(backup: Backup): void {
  accountStore.setAll(backup.accounts);
  billStore.setAll(backup.bills);
  debtStore.setAll(backup.debts);
  incomeStore.setAll(backup.income);
}
