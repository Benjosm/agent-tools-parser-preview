1. Install dependencies
`npm install`

2. Run the unit tests
`npm run test`
You should see 10/12 pass. See KNOWN_ISSUES.md.
All the failing test cases have been included in this preview.

3. Define the actions and system prompt
* Use the actionSchemaMap to define what fields each action requires for the AI.
```
[AgentAction.GOOGLE_SEARCH]: {
      required: { 
        "query": "string", 
      },
      optional: {
        "maxResults": "number",
      }
    },
```
* Create a function for formatting the schemas into a string.
* Add the schemas and instructions to your system prompt.

The Pro version already does this and contains two starter actions with an example implmenentation.
