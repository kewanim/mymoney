// Schedules local (on-device) notifications for upcoming/overdue bills and
// debts. No backend involved — computed fresh from current data and
// rescheduled from scratch on every call, which keeps this simple (no
// tracking of what's already scheduled) at the cost of a cancel+reschedule
// round trip whenever bills/debts change. Only does anything inside the
// native iOS app; no-ops in a plain browser tab.

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Bill, Debt } from "@/lib/types";
import { displayBillStatus, formatCurrency } from "@/lib/format";
import type { ReminderSettings } from "@/lib/reminderSettings";

function dateAt9am(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 9, 0, 0, 0);
}

function next9amToday(): Date {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return d;
}

// If a computed time has already passed, push it to the same time tomorrow
// so an "overdue" reminder never silently fails to schedule just because
// the app happened to be opened after 9am.
function futureOr9amTomorrow(target: Date): Date {
  if (target.getTime() > Date.now()) return target;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  return tomorrow;
}

export interface PendingReminder {
  id: number;
  title: string;
  body: string;
  schedule: { at: Date };
}

// Pure — no Capacitor calls, no side effects. Reads the real clock (via
// Date.now()/new Date()) rather than taking a "now" parameter; tests control
// it with vi.setSystemTime() instead of threading a clock through every call.
export function computeReminders(
  bills: Bill[],
  debts: Debt[],
  settings: ReminderSettings,
): PendingReminder[] {
  const notifications: PendingReminder[] = [];
  if (!settings.enabled) return notifications;
  let id = 1;

  for (const bill of bills) {
    if (bill.status === "paid" || bill.autopay) continue;
    const status = displayBillStatus(bill);
    const due9am = dateAt9am(bill.dueDate);
    const body = formatCurrency(bill.amount);

    if (status === "overdue") {
      notifications.push({
        id: id++,
        title: `${bill.name} is overdue`,
        body,
        schedule: { at: futureOr9amTomorrow(next9amToday()) },
      });
    } else if (status === "due_today") {
      if (due9am.getTime() > Date.now()) {
        notifications.push({ id: id++, title: `${bill.name} is due today`, body, schedule: { at: due9am } });
      }
    } else {
      notifications.push({ id: id++, title: `${bill.name} is due today`, body, schedule: { at: due9am } });
      if (settings.daysBefore > 0) {
        const reminderAt = new Date(due9am);
        reminderAt.setDate(reminderAt.getDate() - settings.daysBefore);
        if (reminderAt.getTime() > Date.now()) {
          notifications.push({
            id: id++,
            title: `${bill.name} due in ${settings.daysBefore} day${settings.daysBefore === 1 ? "" : "s"}`,
            body,
            schedule: { at: reminderAt },
          });
        }
      }
    }
  }

  for (const debt of debts) {
    const body = formatCurrency(debt.currentBalance);
    if (debt.isLate) {
      notifications.push({
        id: id++,
        title: `${debt.name} is late`,
        body,
        schedule: { at: futureOr9amTomorrow(next9amToday()) },
      });
      continue;
    }
    if (!debt.dueDate) continue;
    const due9am = dateAt9am(debt.dueDate);
    if (due9am.getTime() <= Date.now()) continue;

    notifications.push({ id: id++, title: `${debt.name} is due today`, body, schedule: { at: due9am } });
    const isDueToday = due9am.toDateString() === new Date().toDateString();
    if (!isDueToday && settings.daysBefore > 0) {
      const reminderAt = new Date(due9am);
      reminderAt.setDate(reminderAt.getDate() - settings.daysBefore);
      if (reminderAt.getTime() > Date.now()) {
        notifications.push({
          id: id++,
          title: `${debt.name} due in ${settings.daysBefore} day${settings.daysBefore === 1 ? "" : "s"}`,
          body,
          schedule: { at: reminderAt },
        });
      }
    }
  }

  return notifications;
}

export async function rescheduleReminders(
  bills: Bill[],
  debts: Debt[],
  settings: ReminderSettings,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const existing = await LocalNotifications.getPending();
  if (existing.notifications.length > 0) {
    await LocalNotifications.cancel({
      notifications: existing.notifications.map((n) => ({ id: n.id })),
    });
  }

  if (!settings.enabled) return;

  const permission = await LocalNotifications.checkPermissions();
  if (permission.display !== "granted") {
    const requested = await LocalNotifications.requestPermissions();
    if (requested.display !== "granted") return;
  }

  const notifications = computeReminders(bills, debts, settings);
  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
}
