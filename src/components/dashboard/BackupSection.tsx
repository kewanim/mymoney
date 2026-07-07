"use client";

import { useState } from "react";
import { z } from "zod";
import { downloadBackup, parseBackup, restoreBackup } from "@/lib/backup";
import { Card, PrimaryButton } from "./ui";

export function BackupSection() {
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setImported(false);

    try {
      const text = await file.text();
      const backup = parseBackup(text);
      const ok = window.confirm(
        "This replaces everything currently saved on this device with the contents of that backup file. Continue?",
      );
      if (!ok) return;
      restoreBackup(backup);
      setImported(true);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError("That doesn't look like a MyMoney backup file.");
      } else {
        setError("Couldn't read that file.");
      }
    }
  }

  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold tracking-tight">Move data between devices</h2>
      <p className="mb-3 text-sm text-ink-soft">
        Everything&rsquo;s saved only on this device. Export a backup file here, then send it to your
        other device (AirDrop, email, iCloud Drive) and import it there.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <PrimaryButton type="button" onClick={downloadBackup}>
          Export backup
        </PrimaryButton>
        <input
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
          className="text-sm text-ink-soft file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-field file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-ink"
        />
      </div>
      {error && <p className="mt-2 text-sm text-critical">{error}</p>}
      {imported && <p className="mt-2 text-sm text-good">Backup restored.</p>}
    </Card>
  );
}
