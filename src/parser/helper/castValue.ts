import { sanitizeString } from "../../util/sanitizeString.js";
import { FieldDefinition } from "../types/FieldDefinition.js";

/**
 * @description Converts a raw string into its inferred type (JSON, number, boolean, or string).
 *
 * @param raw - The string value to cast.
 * @param def - Optional field definition metadata.
 * 
 * @returns any
 */
export const castValue = (raw: string, def?: FieldDefinition): any => {
      raw = raw.trim();
      // Try JSON for arrays/objects
      if (/^[\[\{]/.test(raw)) {
        const sanitized = sanitizeString(raw);
        try { return JSON.parse(sanitized); } catch {}
      }
      // Numbers
      if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
      // Booleans
      if (/^(true|false)$/i.test(raw)) return raw.toLowerCase() === "true";
      // Strip quotes
      return raw.replace(/^"(.*)"$/, "$1");
};
