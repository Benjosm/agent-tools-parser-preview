import { actionSchemaMap } from "../../config/actionSchemaMap.js";
import { AgentAction } from "../../types/AgentAction.js";
import { FieldDefinition } from "../types/FieldDefinition.js";
import { actionSchemaToFieldDefs } from "./actionSchemaToFieldDefs.js";

/**
 * @description Retrieves the field definitions for a specific action identifier.
 *
 * @param action - The action name.
 * 
 * @returns FieldDefinition[]
 */
export function getFieldDefinitions(action: string): FieldDefinition[] {
    return actionSchemaToFieldDefs(
        actionSchemaMap[action.toUpperCase() as AgentAction]
    );
}
