import { FieldDefinition } from "../types/FieldDefinition.js";
import { normalizeType } from "./normalizeType.js";

/**
 * @description Transforms an action schema entry into an array of FieldDefinitions.
 *
 * @param schema - Object containing required and optional field records.
 * 
 * @returns FieldDefinition[]
 */
export function actionSchemaToFieldDefs(
    schema: { required: Record<string, string>; optional: Record<string, string> }
  ): FieldDefinition[] {
    if (!schema) return [];
    
    const defs: FieldDefinition[] = [];
  
    if (schema.required) {
      for (const [name, typeStr] of Object.entries(schema.required)) {
        defs.push({
          name,
          type: normalizeType(typeStr),
          optional: false,
        });
      }
    }
    
    if (schema.optional) {
      for (const [name, typeStr] of Object.entries(schema.optional)) {
        defs.push({
          name,
          type: normalizeType(typeStr),
          optional: true,
        });
      }
    }
  
    return defs;
}
