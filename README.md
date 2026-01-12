# The Madison Parser (v1.0)

### Ultra-Reliable, "No-JSON" LLM Tool Calling for TypeScript

The **Madison Parser** is a production-grade engine designed to solve the "JSON Escaping Hell" that plagues autonomous AI agents. While standard parsers fail when an LLM outputs complex code blocks, nested quotes, or multi-line strings, the Madison Parser handles them with **100% structural integrity**.

## Why this Parser?

Most developers rely on the LLM to output perfect JSON. When the AI tries to write a 50-line Python script or a complex YAML block inside a JSON string, it inevitably breaks.

**This parser is different:**

* **No-JSON Constraints:** The AI can write raw code, multi-line descriptions, and YAML-style blocks without worrying about escaping quotes or stringification.
* **Multi-Step & Parallel Ready:** Designed to extract a sequence of actions from a single response, allowing the agent to think and act in one turn.
* **120+ Unit Tests:** It is backed by an exhaustive test suite covering every edge case from partial tool calls to deeply nested indentation.
* **Agnostic & Flexible:** Works with OpenRouter, OpenAI, Claude, or local models like Ollama.

---

## Key Features

* **Flexible Formatting:** Supports YAML-style indentation, standard JSON, and natural language arrays.
* **Prompt Driven:** Includes a `System Prompt Generator` that aligns the LLM to the parser's expected structure automatically.
* **TypeScript First:** Built with strict typing for safe integration into modern Node.js environments.
* **Token Efficient:** Eliminates the token overhead of heavy JSON syntax and escaping characters.

---

## Documentation

To get started, please refer to the following guides included in this repository:

* **[QUICKSTART.md](./QUICKSTART.md):** Get up and running in under 2 minutes.
* **[EXAMPLE.ts](./src/EXAMPLE.ts):** A full walkthrough of the "Plan-Execute-Review" loop.
* **[ADD_ACTIONS.md](./ADD_ACTIONS.md):** Learn how to define your own custom tools and schemas.
* **[KNOWN_ISSUES.md](./KNOWN_ISSUES.md):** Transparency on current parser behavior (e.g., newline trimming in YAML blocks).

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Verify reliability
npm run test

```

> **Note:** You should see **120/122 tests passing**. I maintain a rigorous test-driven development cycle to ensure that even the weirdest LLM hallucinations don't break your production logic.

---

## Usage Snippet

```typescript
// Define the allowed actions for the agent (this can be dynamically generated and/or filtered)
const possibleActions = [
    AgentAction.READ_FILE,
    AgentAction.WRITE_FILE
]

// Get the Schemas descriptions to tell the agent how to write the actions
const actionSchemas = getActionSchemas(possibleActions);

// Get the instructions and include which actions should be used in the example
const actionInstructions = getActionInstructions(actionSchemas, possibleActions[0], possibleActions[1]);

// Add the instructions to your system prompt
systemPrompt += '\n\n' + actionInstructions;

// Send the request to the AI
const response = getChatCompletion(systemPrompt, messages);

let actions = parseActionSchema(response);

// Call the actions sequentially or in parrallel
for (const [index, actionItem] of actions.entries()) {

    const name = actionItem.action as AgentAction;
    const params = actionItem.params;
    const message = actionItem.message;

    try {
        // Validate the action name
        if (typeof name !== "string") {
            throw new Error(`Invalid action name: ${name}. Make sure to use use the correct field name and only use the listed action names.`);
        }

        // validate params 
        if (!params || typeof params !== "object") {
            throw new Error(`Invalid or missing params: ${params}`);
        }

        // Get the function
        const actionHandler = actionMap[(name as string).toUpperCase() as AgentAction];
        if (!actionHandler) {
            throw new Error(`No handler found for action: ${name}`);
        }

        // Call the function
        const result = await actionHandler(params);

        // Next steps...
        // Save the result in your action or conversation history

    } catch(error: any) {
        // Handle the error (add the failed action to the history or attempt a dedicated retry)
    }
};

```

---

## License & Support

This is the **Lite Version** of the Madison Agentic Foundation. For the full framework including **Autonomous History Pruning**, **State Management**, and **Local AI (Ollama) Orchestration**, please visit the [Gumroad Store](https://benjomoen.gumroad.com/l/ltvxyh).
