import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "memorize",
  version: "1.0.0",
});

server.registerTool(
  "image",
  {
    title: "Generate image",
    description: "Generate an image from a prompt.",
    inputSchema: {
      prompt: z.string(),
    },
  },

  async ({ prompt }) => {
    const res = await fetch("http://host.docker.internal:8002/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: await res.text(),
          },
        ],
      };
    }

    const data = await res.json();

    return {
      content: [
        {
          type: "text",
          text: data.path,
        },
      ],
    };
  },
);

server.registerTool(
  "ping",
  {
    title: "Ping",
    description: "Test tool",
    inputSchema: {
      message: z.string(),
    },
  },
  async ({ message }) => {
    return {
      content: [
        {
          type: "text",
          text: `pong: ${message}`,
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
