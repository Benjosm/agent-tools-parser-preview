import { AgentAction } from "../types/AgentAction.js";
import { removeUnmatchedTrailingDelimiters } from "../util/removeUnmatchedTrailingDelimiters.js";
import { sanitizeString } from "../util/sanitizeString.js";
import { castValue } from "./helper/castValue.js";
import { getFieldDefinitions } from "./helper/getFieldDefinitions.js";
import { getSchemaValueForKey } from "./helper/getSchemaValueForKey.js";
import yaml from 'js-yaml';
import { isSeparator } from "./helper/isSeparator.js";
import { ParsedAction } from "./types/ParsedAction.js";

/**
 * @description Parses a custom-formatted string into structured action objects.
 *
 * @param input - The raw text containing action directives.
 * 
 * @returns Array<{
 *   action: string,
 *   message?: string,
 *   params: Record<string, any>
 * }>
 */
export function parseActionSchema(input: string): ParsedAction[] {

    const lines = input.split(/\r?\n/);
    const result: ParsedAction[] = [];
  
    let current: ParsedAction | null = null;
    let nextAction: ParsedAction | null = null;
    let inCodeBlock = false;
    let codeKey = "";
    let codeBuffer: string[] = [];
    let fencedAction = false;
    let parsedAction = false;
    let firstActionFenced = false;
    let currentPreceded = false;
  
    const flushCurrent = (last?: boolean) => {
      if (currentPreceded && !last) {
        // Only include preceded actions if they don't repeat
        if (current && (current?.action !== nextAction?.action || current?.params !== nextAction?.params)) {
          // Actions are different 
          result.push(current);
        }
      } else if (current) {
        result.push(current);
      }
      current = null;
      inCodeBlock = false;
      codeKey = "";
      codeBuffer = [];
    };
  
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match "action: WORD" with optional leading non-space chars, but disallow space before "action:"
      const mAct = line.match(/^\s*action\s*:\s*(\S+)$/i);
      const pAct = line.match(/^.*\Saction\s*:\s*(\S+)$/i);
      if (mAct || pAct) {
        // Ensure no extra words after the action name
        let rest = '';
        if (mAct) {
          rest = mAct[1].trim();
        } else if (pAct) {
          rest = pAct[1].trim();
        }
        if (!rest.includes(' ')) {
          // Check if there's a separator before the 'action:' keyword on the same line
          const actionIndex = line.indexOf('action:');
          const beforeAction = line.slice(0, actionIndex).trim();
          const isSameLineFence = isSeparator(beforeAction);

          // Or previous line is a separator
          const isPrevLineFence = typeof(lines[i - 1]) === 'string' && isSeparator(lines[i - 1].trim());

          fencedAction = isSameLineFence || isPrevLineFence;

          if (!parsedAction && fencedAction) {
            firstActionFenced = true;
          }

          parsedAction = true;
          nextAction = { action: rest, params: {} };
          flushCurrent();
          currentPreceded = !mAct && !!pAct;
          current = { action: rest, params: {} };
          continue;
        }
      }
      if (!current) continue;
  
      // message (optional)
      const mMsg = line.match(/^\s*message\s*:\s*(\S.*)$/i);
      if (mMsg && !inCodeBlock) {
        current.message = mMsg[1].trim().replace(/^"(.*)"$/, "$1");
        continue;
      }
  
      // enter params
      if (/^\s*params\s*:/i.test(line) && !inCodeBlock) {
        continue;
      }
  
      // normal param line: key: value
      const mParam = line.match(/^\s*(\w+)\s*:\s*(.*)$/);
      if (mParam) {
        const [, key, raw] = mParam;
        const defs = getFieldDefinitions(current.action);
        const def = defs.find(f => f.name === key);
        const indentMatch0 = line.match(/^(\s*)/);
        const indent0 = indentMatch0 ? indentMatch0[1].length : 0;
        const isObjectParam = !def?.type || def?.type === 'array' || def?.type === 'object';

        // if raw is empty and next line is indented deeper, treat as object with nested keys
        if (raw.trim() === "" && i + 1 < lines.length && isObjectParam) {
          // Get each following line with same deeper indentation
          const nextLines: string[] = [];
          while (i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            const indentMatch = nextLine.match(/^(\s*)/);
            const nextIndent = indentMatch ? indentMatch[1].length : 0;
            
            if (nextIndent <= indent0 && nextLine.trim() !== '') break;
            nextLines.push(nextLine);
            i++;
          }
          // Attempt to parse as yaml
          try {
            const parsed = yaml.load(nextLines.join('\n'));
            if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
              current.params[key] = parsed;
              i += nextLines.length;
              continue;
            }
          } catch (_) {}

          const obj: Record<string, any> = {};
          let firstIndent: number | null = null;
          let lastKey: string | null = null;
          let j = i + 1;
          while (j < lines.length) {
            const nextLine = lines[j];
            const subMatch = nextLine.match(/^(\s*)(\w+)\s*:\s*(.*)$/);
            if (!subMatch) break;
            const [ , subIndentSpaces, subKey, subRaw ] = subMatch;
            const indentSub = subIndentSpaces.length;
            if (indentSub <= indent0) break;
  
            // establish first-level indent
            if (firstIndent === null && indentSub > indent0) {
              firstIndent = indentSub;
            }
            if (indentSub === firstIndent) {
              // new direct child
              obj[subKey] = subRaw.trim() === "" ? "" : castValue(subRaw);
              lastKey = subKey;
            } else if (firstIndent !== null && indentSub > firstIndent && lastKey) {
              // nested under last direct child
              if (typeof obj[lastKey] !== 'object' || obj[lastKey] === "") {
                obj[lastKey] = {};
              }
              (obj[lastKey] as Record<string, any>)[subKey] = castValue(subRaw);
            } else {
              break;
            }
            j++;
          }
          if (Object.keys(obj).length) {
            current.params[key] = obj;
            i = j - 1;
            continue;
          }
        }
        
        // YAML literal block (“|”)
        if (/^[>|][+-\\]?$/.test(raw.trim())) {
          const litLines: string[] = [];
          const baseIndent = lines[i].match(/^(\s*)/)?.[1].length ?? 0;
          let j = i + 1;
          while (j < lines.length) {
            const next = lines[j];

            // Compute current line indent
            const currentIndent = next.match(/^(\s*)/)?.[1].length ?? 0;

            // if the first line is a fence, skip it without breaking
            if (litLines.length === 0 && isSeparator(next)) {
              j++;
              continue;
            }

            // stop on an unindented “new param:” or next action/message
            if ((/^\s*\w+\s*:/.test(next) && /^\S/.test(next) && currentIndent <= baseIndent) || (isSeparator(next.trim()) && currentIndent <= baseIndent)) break;
            litLines.push(next);
            j++;
          }
        
          // compute indent of first non-empty block line
          const firstLineIndent = litLines.length > 0
            ? (litLines[0].match(/^(\s*)/)![1].length)
            : 0;
        
          // strip up to firstLineIndent spaces from each line
          const normalized = litLines.map(l => {
            const prefix = l.slice(0, firstLineIndent);
            // if all‐spaces, remove them; otherwise leave line as‐is
            if (/^ *$/.test(prefix)) {
              return l.slice(prefix.length);
            }
            return l;
          });
        
          // join and drop trailing newline
          const blockText = normalized.join("\n").replace(/\n$/, "");
        
          current.params[key] = blockText;
          i = j - 1;
          continue;
        }

        // YAML-style dash lists
        if (def?.type === "array" && raw.trim() === "") {
          const arr: any[] = [];
          let j = i + 1;
          while (j < lines.length) {
            const mItem = lines[j].match(/^\s*-\s*(.+)$/);
            if (!mItem) break;
            arr.push(castValue(mItem[1]));
            j++;
          }
          current.params[key] = arr;
          i = j - 1;              // skip ahead past the dash-list
          continue;
        }

        // Multi-line JSON object or array
        const startTrim = raw.trim();
        if ((startTrim.startsWith("{") || startTrim.startsWith("[")) &&
            !(startTrim.endsWith("}") || startTrim.endsWith("]")) && isObjectParam) {

          // gather until braces balance
          const buffer = [startTrim];
          let braceCount = 0;
          for (const ch of startTrim) {
            if (ch === "{") braceCount++;
            if (ch === "}") braceCount--;
            if (ch === "[") braceCount++;
            if (ch === "]") braceCount--;
          }

          let j = i + 1;
          while (j < lines.length && braceCount > 0) {
            const part = lines[j].trim();
            buffer.push(part);
            for (const ch of part) {
              if (ch === "{") braceCount++;
              if (ch === "}") braceCount--;
              if (ch === "[") braceCount++;
              if (ch === "]") braceCount--;
            }
            j++;
          }

          const joined = buffer.join("\n");
          try {
            current.params[key] = JSON.parse(joined);
          } catch (error: any) {
            // fallback to raw multi-line text if parse fails
            current.params[key] = joined;
          }
          i = j - 1;
          continue;
        }

        // Inline JSON / array on a single line
        const singleTrim = raw.trim();
        if ((singleTrim.startsWith("{") && singleTrim.endsWith("}")) ||
            (singleTrim.startsWith("[") && singleTrim.endsWith("]")) && isObjectParam) {
          try {
            current.params[key] = JSON.parse(sanitizeString(singleTrim));
          } catch {
            current.params[key] = singleTrim;
          }
          continue;
        }

        // Inline comma-separated list (strict punctuation rules; allow ., -, /, _, and trailing slash)
        const csvTrim = raw.trim();

        const matchingQuote =
          (csvTrim.startsWith('"') && csvTrim.endsWith('"')) ? '"' :
          (csvTrim.startsWith("'") && csvTrim.endsWith("'")) ? "'" :
          (csvTrim.startsWith("`") && csvTrim.endsWith("`")) ? "`" :
          null;

        const isFullyQuoted =
          matchingQuote !== null &&
          csvTrim.slice(1, -1).indexOf(matchingQuote) === -1;

        const looksLikeSentence =
          /^[A-Z]/.test(csvTrim) &&
          /[.?!]$/.test(csvTrim) &&
          /\b[^,]\s/.test(csvTrim);
        
        if (
          isObjectParam &&
          !isFullyQuoted &&
          !looksLikeSentence &&
          csvTrim.includes(",") &&
          !/([^\w\s,/_\-'"`])\s/.test(csvTrim) &&              // Only allow safe punctuation followed by space
          !/[^,\w\s./_\-'"`]$/.test(csvTrim) &&                 // Disallow bad punctuation at end (except slash/quotes)
          !/[^/'"`]\s*\/$/.test(csvTrim)                        // If ends in slash, char before must be safe
        ) {
          const list = csvTrim.split(",").map(s => {
            let trimmed = s.trim();

            // Strip matching surrounding quotes: ', ", or `
            if (
              (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
              (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
              (trimmed.startsWith("`") && trimmed.endsWith("`"))
            ) {
              trimmed = trimmed.slice(1, -1);
            }

            const num = Number(trimmed);
            return isNaN(num) ? trimmed : num;
          });
          current.params[key] = list;
          continue;
        }

        const keyType = getSchemaValueForKey(current.action as AgentAction, key);

        // Inline “free-form” multi-line (no delimiter) with lookahead
        if (i + 1 < lines.length && keyType !== 'path') {
          const temp = [raw];
          let hasNonEmpty = false;
          let j = i + 1;
          let lastFence = false;

          for (; j < lines.length && !lastFence; j++) {
            const nxt = lines[j];
            const indentN = (nxt.match(/^(\s*)/)?.[1].length) || 0;
            const keyRE = /^\s*(?:\w+)\s*:/;
            const headerRE = /^\s*(?:action|message)\s*:/;

            // if nxt is a delimiter, check if it's the last key and the last fence before the next action or EOF
            if (fencedAction && isSeparator(nxt.trim())) {
              if (j + 1 >= lines.length) {
                // last fence so break
                break;
              }

              // Peek forward to find fence or non-blank line
              for (let k = j + 1; k < lines.length; k++) {
                const peekLine = lines[k].trim();
                if (isSeparator(peekLine)) {
                  // fence found (\n```\n```) -> include if odd number of fences && number of fences in temp > 0
                  const fenceCount = temp.filter(l => isSeparator(l.trim())).length;
                  if (fenceCount === 0 || fenceCount % 2 === 0) {
                    lastFence = true;
                    break;
                  }
                  break;
                } else if (peekLine !== '') {
                  break;
                }
              }

              for (let k = j + 1; k < lines.length; k++) {
                const knxt = lines[k];
                if (keyRE.test(knxt) && !headerRE.test(knxt) || isSeparator(knxt.trim())) {
                  break;
                }

                if (headerRE.test(knxt) || k + 1 >= lines.length) {
                  lastFence = true;
                  break;
                }
              }

              if (lastFence) {
                break;
              }
            }

            // if not fenced action but first action fenced, check if its the last fence beofre EOF
            if (!lastFence && !fencedAction && firstActionFenced && isSeparator(nxt.trim())) {
              if (j + 1 >= lines.length) {
                // last fence so break
                break;
              }

              for (let k = j + 1; k < lines.length; k++) {
                const knxt = lines[k];
                if (keyRE.test(knxt) || headerRE.test(knxt) || isSeparator(knxt.trim())) {
                  break;
                }

                if (k + 1 >= lines.length) {
                  lastFence = true;
                  break;
                }
              }

              if (lastFence) {
                break;
              }
            }
            
            // stop only when it's a param/action/message at the same base indent
            if ((indentN === indent0 && keyRE.test(nxt))
              || (indentN <= indent0 && headerRE.test(nxt))) {
              break;
            }

            temp.push(nxt);
            if (nxt.trim() !== '') hasNonEmpty = true;
          }

          // only treat as multi-line if we actually saw non-empty content beyond the first line
          if (temp.length > 1 && hasNonEmpty) {
            current.params[key] = removeUnmatchedTrailingDelimiters(temp).join("\n").replace(/\n$/, "");
            i = j - 1;
            continue;
          }
        }

        // Inline JSON / primitives
        current.params[key] = castValue(raw, def);
      }
    }
  
    // push last
    flushCurrent(true);
    return result;
}
