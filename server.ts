import express from "express";
import type { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { randomUUID } from "crypto";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

// Store transports per session
const transports = new Map<string, StreamableHTTPServerTransport>();

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "hello-server",
    version: "1.0.0",
  });

  // Register the sayHello tool
  server.tool(
    "sayHello",
    "Greets a person by name",
    {
      name: z.string().describe("The name of the person to greet"),
    },
    async ({ name }) => {
      return {
        content: [
          {
            type: "text",
            text: `Hello, ${name}! 👋 Welcome to the MCP Streamable HTTP server!`,
          },
        ],
      };
    }
  );

  return server;
}

// Handle POST /mcp — main MCP endpoint
app.post("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports.has(sessionId)) {
    // Reuse existing session transport
    transport = transports.get(sessionId)!;
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // New session: create transport + server
    const newSessionId = randomUUID();
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => newSessionId,
      onsessioninitialized: (id) => {
        transports.set(id, transport);
        console.log(`[MCP] Session initialized: ${id}`);
      },
    });

    const server = createMcpServer();
    await server.connect(transport);

    // Clean up on close
    transport.onclose = () => {
      transports.delete(newSessionId);
      console.log(`[MCP] Session closed: ${newSessionId}`);
    };
  } else {
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Bad request: missing or invalid session",
      },
      id: null,
    });
    return;
  }

  await transport.handleRequest(req, res, req.body);
});

// Handle GET /mcp — SSE stream for server-to-client messages
app.get("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({ error: "Invalid or missing session ID" });
    return;
  }

  const transport = transports.get(sessionId)!;
  await transport.handleRequest(req, res);
});

// Handle DELETE /mcp — terminate a session
app.delete("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({ error: "Invalid or missing session ID" });
    return;
  }

  const transport = transports.get(sessionId)!;
  await transport.handleRequest(req, res);
  transports.delete(sessionId);
  console.log(`[MCP] Session deleted: ${sessionId}`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ MCP Streamable HTTP server running on http://localhost:${PORT}/mcp`);
});