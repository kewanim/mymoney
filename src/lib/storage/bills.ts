import type { Bill } from "@/lib/types";
import { createLocalStore } from "./createLocalStore";

export const billStore = createLocalStore<Bill>("mymoney:bills");
