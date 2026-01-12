import { AgentAction } from "../types/AgentAction.js";

/**
 * @description Enum defining identifiers for available agent actions.
 */
export const actionSchemaMap: Record<AgentAction, { required: Record<string, string>, optional: Record<string, string> }> = {
    [AgentAction.READ_FILE]: {
      required: { "filePath": "path" },
      optional: {}
    },
  
    [AgentAction.WRITE_FILE]: {
      required: { 
        "filePath": "path", 
        "content": "code/text" 
      },
      optional: {}
    },
};
