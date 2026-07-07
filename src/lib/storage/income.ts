import type { Income } from "@/lib/types";
import { createLocalStore } from "./createLocalStore";

export const incomeStore = createLocalStore<Income>("mymoney:income");
