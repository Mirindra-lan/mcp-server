import express from "express";
import type { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { randomUUID } from "crypto";
import cors from "cors";
import "dotenv/config";
import TicketManager from "./tools/ticket/ticketManager";
import { transferCallToExtension, callNumber, hangup } from "./tools/call/transfertCall";
import { getUserTTplanning, getRangeTTplanning } from "./tools/planning/getPlanning";

const app = express();
app.use(cors());
app.use(express.json());

// Store transports per session
const transports = new Map<string, StreamableHTTPServerTransport>();

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "avr-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      prompts: {},
      tools: {}
    }
  });


  server.tool(
    "create-ticket",
    "Create GLPI ticket for a request or issue",
    {
      name: z.string().describe("The subject of the ticket that you put from the discussion"),
      content: z.string().describe("The description of the ticket, put it from the discussion"),
      impact: z.number().int().describe("Impact (1-5): guess from the conversation"),
      urgency: z.number().int().describe("Urgency (1-5): guess from the conversation"),
      category: z.number().int().describe(`Category ID:
1 PROBLEME DE CONNEXION
2 PROBLEME DE DEMARRAGE DE PC
3 SITE / LIEN BLOQUE
4 PROBLEME D'ECRAN
5 PROBLEME DE CHAISE
6 2FA
7 CONFIGURATION EYEBEAM / VICIDIAL
8 CONFIGURATION MAIL
9 CONFIGURATION NOUVEAU POSTE
10 DEBLOCAGE DE SITE/LIEN
11 ASSISTANCE UTILISATEUR
12 ENREGISTREMENT DE POINTAGE
13 DEMANDE DE PERIPHERIQUE
14 DEMANDE NOUVEAU SOURIS
15 DEMANDE NOUVEAU CLAVIER
17 DEMANDE DEUXIEME ECRAN
18 PROBLEME D'ELECTRICITE
19 PROBLEME D'ECLAIRAGE
20 COUPURE DE COURANT
21 DEMANDE DE PREPARATION DE SALLE VISIO
22 DEMANDE DE TELECHARGEMENT
23 TIME TRACKING`),
      location: z.number().int().describe(`Location name or ID:
1 SETEX1
2 SETEX2
3 LATONELLE
4 MONTECRISTO
5 GEODEK
6 SETEX1>SOUS-SOL
7 SETEX1>RDC
8 SETEX1>R+1
9 SETEX1>R+2
10 SETEX1>DMZ
11 MONTECRISTO>GARAGE
12 MONTECRISTO>RDC
13 MONTECRISTO>R+1
14 MONTECRISTO>R+2
15 MONTECRISTO>DMZ
16 SETEX1>SOUS-SOL>VISIO
17 SETEX1>RDC>VISIO
18 STEXT1>R+2>VISIO
19 SETEX2>R+1
20 SETEX2>APPARTEMENT
21 SETEX2>RDC
22 GEODEK>RDC
23 GEODEK>R+1
24 GEODEK>R+2
25 GEODEK>R+3
26 LATONELLE>RDC
27 LATONELLE>R+1
28 LATONELLE>R+2
29 MONTECRISTO>RDC>VISIO
30 MONTECRISTO>R+1>VISIO
31 MONTECRISTO>R+2>VISIO`)
    },
    async ({name, content, impact, urgency, category, location}) => {
      const manager = new TicketManager();
      try {
        // Pass as string because Ticket constructor expects a string to parse
        const res = await (manager as any).create(JSON.stringify({
          name: name,
          category: category,
          content: content,
          impact: impact,
          urgency: urgency,
          location: location
        }));

        if(res) {
          return {
            content: [
              {type: "text", text: `Ticket created successfully, ticket information: ${JSON.stringify(res)}`}
            ]
          }
        } else {
          return {
            content: [
              {type: "text", text: `Creating ticket failed. Please check if category and location are valid.`}
            ]
          }
        }

      } catch (error: any) {
        return {
          content: [
            {type: "text", text: `Error create ticket, error information ${error.message || error}`}
          ]
        }
      }
    }
  );

  server.tool(
    "delete-ticket",
    "Delete a GLPI ticket by ticket id",
    {
      id: z.number().describe("The Id of the ticket to delete")
    },
    async ({id}) => {
      const manager = new TicketManager();
      try {
        const result = await manager.delete(id);
        return {
          content: [
            {type: "text", text: `Ticket ${id} deleted successfully`}
          ]
        }
      } catch (error: any) {
        return {
          content: [
            {type: "text", text: `Error deleting ticket ${id} : ${error}`}
          ]
        }
      }
    }
  )

  server.tool(
    "transfer-to-agent",
    "Transfer call from voice bot to an human agent",
    {
      uuid: z.uuidv4().describe("discussion unique id").optional()
    },
    async ({ uuid }) => {
      try {
        const result = await transferCallToExtension(process.env.AGENT_NUMBER || "2000", uuid);

        return {
          content: [
            {
              type: "text",
              text: `result from server: ${JSON.stringify(result.data)}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Transfer failed: ${error.response?.data?.error || error.message || error}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "hangup",
    "Terminate the call",
    {
      uuid: z.uuidv4().optional()
    },
    async ({uuid}) => {
      try {
        const result = await hangup(uuid);
        return {
          content: [
            {
              type: "text",
              text: `result from server: ${JSON.stringify(result.data)}`
            }
          ]
        }
      } catch (error: any) {
        return {
          content: [{
            type: "text",
            text: `Hangup failed: ${error.response?.data?.error || error.message || error}`
          }]
        }
      }
    }
  )

  server.tool(
  "call-number",
  "Call an extension or number from the server",
  {
    extension: z.string().describe("The extension or number to call"),
  },
  async ({ extension }) => {
    try {
      const res = await callNumber(extension);

      return {
        content: [
          {
            type: "text",
            text: `Calling ${extension}...`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Call failed: ${error.message || error}`,
          },
        ],
      };
    }
  }
);

server.tool(
  "get-user-planning",
  "Get planning for a specific user between two dates",
  {
    matricule: z.number().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
  },
  async ({ matricule, startDate, endDate }) => {
    try {
      const data = await getUserTTplanning(startDate, endDate, matricule);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data),
          },
        ],
      };
    } catch (error: any) {
      console.log(error.response.data.message);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.response.data.message}`,
          },
        ],
      };
    }
  }
);

server.tool(
  "get-range-planning",
  "Get planning for all users in a date range",
  {
    startDate: z.string(),
    endDate: z.string().optional(),
  },
  async ({ startDate, endDate }) => {
    try {
      const data = await getRangeTTplanning(startDate, endDate);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data),
          },
        ],
      };
    } catch (error: any) {
      console.log(error.response.data.message);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.response.data.message}`,
          },
        ],
      };
    }
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

const PORT = Number(process.env.PORT) || 3000 ;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ MCP Streamable HTTP server running on http://localhost:${PORT}/mcp`);
});