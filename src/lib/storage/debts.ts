import type { Debt } from "@/lib/types";
import { createLocalStore } from "./createLocalStore";

export const debtStore = createLocalStore<Debt>("mymoney:debts");
