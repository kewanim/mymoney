import type { Account } from "@/lib/types";
import { createLocalStore } from "./createLocalStore";

export const accountStore = createLocalStore<Account>("mymoney:accounts");
