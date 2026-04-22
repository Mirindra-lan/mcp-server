# 🚀 MCP Streamable HTTP Server

This project is a **Model Context Protocol (MCP) server** built with Node.js and Express. It exposes multiple tools (ticket management, call handling, planning retrieval) via a Streamable HTTP transport.

---

## 📦 Features

- MCP-compliant server using `@modelcontextprotocol/sdk`
- Streamable HTTP transport (SSE + POST)
- Session-based communication
- Tools implemented:
  - ✅ Say Hello
  - 🎫 Create / Delete GLPI Tickets
  - 📞 Call & Transfer Calls
  - 📅 Get User Planning
  - 📊 Get Range Planning

---

## 🛠️ Tech Stack

- Node.js
- Express
- TypeScript
- MCP SDK
- Zod (validation)
- Axios

---

## ⚙️ Installation

```bash
# Clone the repo
git clone <your-repo-url>
cd <project-folder>

# Install dependencies
npm install
```

---

## 🔑 Environment Variables

Create a `.env` file at the root:

```env
PORT=3000
TT_URL=http://your-api-url
TTS_BASE_URL=http://your-tts-service
```

---

## ▶️ Run the Server

```bash
npm run dev
# or
npm start
```

Server will run on:

```
http://localhost:3000/mcp
```

---

## 🔌 MCP Endpoints

### POST `/mcp`
- Main endpoint for MCP requests
- Handles tool execution and initialization

### GET `/mcp`
- SSE stream for server-to-client messages

### DELETE `/mcp`
- Close an active session

---

## 🧠 Available Tools

### 1. `sayHello`
Greets a user

**Input:**
```json
{ "name": "John" }
```

---

### 2. `create-ticket`
Create a GLPI ticket

**Input:**
```json
{
  "name": "Issue title",
  "content": "Description",
  "impact": 3,
  "urgency": 2,
  "category": 1,
  "location": 1
}
```

---

### 3. `delete-ticket`
Delete a ticket

**Input:**
```json
{ "id": 123 }
```

---

### 4. `transfer-call`
Transfer active calls to another extension

**Input:**
```json
{ "extension": "1010" }
```

---

### 5. `call-number`
Trigger a call

**Input:**
```json
{ "extension": "1010" }
```

---

### 6. `get-user-planning`
Retrieve planning for a specific user

**Input:**
```json
{
  "user_id": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

---

### 7. `get-range-planning`
Retrieve planning for all users

**Input:**
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

---

## 🔄 Session Management

- Each MCP session is tracked using a `sessionId`
- Stored in memory (`Map`)
- Automatically cleaned on disconnect

---

## 🧪 Example Flow

1. Initialize session (POST `/mcp`)
2. Receive session ID
3. Send tool requests with `mcp-session-id` header
4. Receive streamed responses

---

## 📁 Project Structure

```
.
├── tools/
│   ├── ticket/
│   ├── call/
│   └── planning/
├── server.ts
├── package.json
└── README.md
```

---

## ⚠️ Notes

- Ensure external services (GLPI, Asterisk, planning API) are running
- Error handling depends on external APIs
- Sessions are stored in memory (not persistent)

---

## 📌 Future Improvements

- Add authentication
- Persist sessions (Redis)
- Logging & monitoring
- Better error handling

---

## 👨‍💻 Author

LANTOSOA Mirindra Lucien

---

## 📄 License

MIT License

