import { actionSchemaMap } from "../../config/actionSchemaMap.js";
import { AgentAction } from "../../types/AgentAction.js";

/**
 * @description Retrieves the schema type for a specific action parameter.
 *
 * @param action - The action identifier.
 * @param key - The parameter name.
 * 
 * @returns string | undefined
 */
export function getSchemaValueForKey(action: AgentAction, key: string): string | undefined {
  const schema = actionSchemaMap[action];
  if (!schema) return undefined;

  return schema.required[key] ?? schema.optional[key];
}
