import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "memorize",
  version: "1.0.0",
});

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
