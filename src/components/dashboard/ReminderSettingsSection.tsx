"use client";

import { Capacitor } from "@capacitor/core";
import {
  useReminderSettings,
  setReminderEnabled,
  setReminderDaysBefore,
} from "@/lib/reminderSettings";
import { Card, Switch, FieldSelect } from "./ui";

const DAYS_OPTIONS = [0, 1, 2, 3, 5, 7];

export function ReminderSettingsSection() {
  const settings = useReminderSettings();
  const isNative = Capacitor.isNativePlatform();

  return (
    <Card>
      <h2 className="mb-4 text-[19px] font-semibold tracking-tight">Reminders</h2>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Bill & debt reminders</p>
          <p className="text-xs text-ink-soft">
            On-device notifications for upcoming, due-today, and overdue items.
          </p>
        </div>
        <Switch checked={settings.enabled} onChange={setReminderEnabled} label="Bill and debt reminders" />
      </div>

      {settings.enabled && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <label className="text-sm text-ink-soft" htmlFor="reminder-days-before">
            Remind me ahead of the due date
          </label>
          <FieldSelect
            id="reminder-days-before"
            value={settings.daysBefore}
            onChange={(e) => setReminderDaysBefore(Number(e.target.value))}
          >
            {DAYS_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d === 0 ? "Due date only" : `${d} day${d === 1 ? "" : "s"} before`}
              </option>
            ))}
          </FieldSelect>
        </div>
      )}

      {!isNative && (
        <p className="mt-3 text-xs text-ink-soft">
          Notifications only fire in the installed iOS app, not in a browser tab.
        </p>
      )}
    </Card>
  );
}
