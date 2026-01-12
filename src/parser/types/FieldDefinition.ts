/**
 * @description Defines the metadata for an action parameter.
 */
export interface FieldDefinition {
    name: string;
    type: "string" | "number" | "boolean" | "array" | "object";
    optional: boolean;
}
