import type { Dictionary } from "../dictionaries";
import { admin } from "./admin";
import { auth } from "./auth";
import { clients } from "./clients";
import { common } from "./common";
import { dashboard } from "./dashboard";
import { documents } from "./documents";
import { invoices } from "./invoices";
import { landing } from "./landing";
import { pro } from "./pro";
import { settings } from "./settings";

// Textes français : même forme que l'anglais, une clé manquante fait échouer typecheck.
export const fr: Dictionary = { common, landing, auth, dashboard, clients, invoices, settings, pro, admin, documents };
