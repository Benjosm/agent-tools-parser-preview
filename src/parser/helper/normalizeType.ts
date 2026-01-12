import { FieldDefinition } from "../types/FieldDefinition.js";

/**
 * @description Normalizes a type string into a standard FieldDefinition type.
 *
 * @param typeStr - The raw type string.
 * 
 * @returns FieldDefinition["type"]
 */
export function normalizeType(typeStr: string): FieldDefinition["type"] {
    // primitives
    if (typeStr === "string")  return "string";
    if (typeStr === "number")  return "number";
    if (typeStr === "boolean") return "boolean";
    if (typeStr === "code/text") return "string";
    if (typeStr === "path") return "string";
  
    // arrays: e.g. "string[]" or "Record<string,string>[]"
    if (/\[\]$/.test(typeStr)) return "array";
  
    // union of string literals → treat as string
    if (/^'.+'(\s*\|\s*'.+')+$/.test(typeStr)) return "string";
  
    // JSON-schema style object or complex type
    return "object";
}
