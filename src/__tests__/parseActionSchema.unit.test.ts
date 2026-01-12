import { vi, describe, it, expect } from 'vitest';

// Mock getFieldDefinitions so YAML arrays are recognized
vi.mock('../parser/helper/getFieldDefinitions.js', () => ({
  getFieldDefinitions: vi.fn((action: string) => {
    // For LIST action, items should be parsed as array
    if (action === 'LIST') {
      return [{ name: 'items', type: 'array', optional: false }];
    }
    // default: no definitions
    return [];
  }),
}));

import { parseActionSchema } from '../parser/parseActionSchema.js';

describe('parseActionSchema', () => {

  it('parses a single action with empty params', () => {
    const input = `
action: FOO
params:`;
    expect(parseActionSchema(input)).toEqual([
      { action: 'FOO', params: {} }
    ]);
  });

  it('parses JSON arrays and objects for params', () => {
    const input = `
action: DATA
params:
  arr: [1,2,3]
  obj: {"x":10,"y":20}
`;
    expect(parseActionSchema(input)).toEqual([
      {
        action: 'DATA',
        params: {
          arr: [1, 2, 3],
          obj: { x: 10, y: 20 },
        }
      }
    ]);
  });

  it('parses comma separated lists with punctuation as arrays', () => {
    const input = `
action: DATA
params:
arr: 'one/two','two.three','three_four'
`;
    expect(parseActionSchema(input)).toEqual([
      {
        action: 'DATA',
        params: {
          arr: ['one/two', 'two.three', 'three_four'],
        }
      }
    ]);
  });

  it('parses YAML-style arrays for params', () => {
    const input = `
action: LIST
params:
  items:
    - foo
    - bar
    - baz
`;
    expect(parseActionSchema(input)).toEqual([
      {
        action: 'LIST',
        params: {
          items: ['foo', 'bar', 'baz'],
        }
      }
    ]);
  });

it('preserves newlines in multiline YAML strings', () => {
  const input = `
action: OBJ
params:
  obj:
    description: |
      Line 1
      Line 2
`;
  expect(parseActionSchema(input)).toEqual([
    {
      action: 'OBJ',
      params: {
        obj: { 
          description: "Line 1\nLine 2\n" 
        },
      }
    }
  ]);
});

  it('parses YAML block scalars for params and preserves indentation', () => {
    const input = `
action: BLOCK
params:
  x: |
   123
    456
`;
    expect(parseActionSchema(input)).toEqual([
      {
        action: 'BLOCK',
        params: {
          x: '123\n 456',
        }
      }
    ]);
  });


  it('parses multi-line block for params without stopping on inline params', () => {
    const input = `
action: BLOCK
params:
  x: 123 y:
456 z:
789 a: 012`;
    expect(parseActionSchema(input)).toEqual([
      {
        action: 'BLOCK',
        params: {
          x: '123 y:\n456 z:\n789 a: 012',
        }
      }
    ]);
  });

  it('parses multi-line block for params when the first few lines are empty', () => {
    const input = `
action: BLOCK
params:
  x:


123
456
789`;
    expect(parseActionSchema(input)).toEqual([
      {
        action: 'BLOCK',
        params: {
          x: `\n\n\n123\n456\n789`
        }
      }
    ]);
  });

  it('parses multi-line block for params when the first few lines are empty (multi-action)', () => {
    const input = `
action: BLOCK
params:
  x:


123
456
789
action: BLOCK
params:
  x: 5
`;
    expect(parseActionSchema(input)).toEqual([
      {
        action: 'BLOCK',
        params: {
          x: `\n\n\n123\n456\n789`
        }
      },
      {
        action: 'BLOCK',
        params: {
          x: 5
        }
      }
    ]);
  });

  it('parses a single action with empty params and leading text', () => {
    const input = `
Yes, the actual results matched the expected results. All 15 tests passed, including the new tests I added to \`issueRoutes.test.ts\`. The test suite now comprehensively validates the \`createIssue\` controller's input validation logic, including required fields, empty values, and invalid formats.

Since all tests have passed and the validation logic is complete, I will proceed to the next subtask, which is to add or update the error handling for the service layer. However, the prompt doesn't specify any error handling for the service layer. It focuses on input validation and related unit tests for the \`issueController.ts\`. Therefore, I will complete the current subtask by adding the \`NEXT_SUBTASK\` action.

action: NEXT_SUBTASK
params:
  (none)
`;
    expect(parseActionSchema(input)).toEqual([
      { action: 'NEXT_SUBTASK', params: {} }
    ]);
  });

  it('parses action when unrelated content is surrounded by delimiters', () => {
    const input = `\`\`\`
some random text
some more random text

even more reandom text
\`\`\`

action: EXECUTE_COMMAND
params:
command: npm start
\`\`\`
`;
    expect(parseActionSchema(input)).toEqual([
      {
        action: 'EXECUTE_COMMAND',
        params: {
          command: 'npm start',
        }
      }
    ]);
  });

it('parses an action prefixed by a sentance', () => {
  const input = `INTERNAL MONOLOGUE: I apologize for the formatting error in the previous response. I will ensure strict adherence to the schema.

My last attempt to modify the file failed because I did not correctly format the action. I need to make the following change to \`src/app/main_temp/settings/page.tsx\`:

Remove the error display conditional block:
\` ) : errorStore.error ? (\` and the empty line \`          ) : cardsData.length > 0 ? (\`
should become \`        ) : cardsData.length > 0 ? (\`

Let's try this again with the correct format for the action.action: TEST_ACTION
message: Hello
`;
  expect(parseActionSchema(input)).toEqual([
    {
      action: 'TEST_ACTION',
      message: 'Hello',
      params: {}
    },
  ]);
});
});
