/**
 * @description Defines the metadata for an action parameter.
 */
export interface ParsedAction {
    action: string;
    message?: string;
    params: Record<string, any>;
}
