import axios from "axios";
import type { AxiosInstance } from "axios";
import Ticket from "./ticket";

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

interface TicketData {
  name?: string;
  category?: number;
  content?: string;
  urgency?: number;
  impact?: number;
  type?: number;
  location?: string;
  request_type?: number;
}

class TicketManager {
  private clientId: string;
  private clientSecret: string;
  private userName: string;
  private password: string;
  private scope: string;
  private api: AxiosInstance;
  private token: string | null;
  private tokenExpiration: number | null;

  constructor() {
    this.clientId = process.env.GLPI_OAUTH_CLIENTID!;
    this.clientSecret = process.env.GLPI_OAUTH_CLIENTSECRET!;
    this.userName = process.env.GLPI_OAUTH_USERNAME!;
    this.password = process.env.GLPI_OAUTH_PASSWORD!;
    this.scope = process.env.GLPI_SCOPE!;
    this.api = axios.create({ baseURL: process.env.GLPI_BASE_URL });
    this.token = null;
    this.tokenExpiration = null;
  }

  async getToken(): Promise<string | null> {
    try {
      const response = await this.api.post<TokenResponse>("/token", {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "password",
        username: this.userName,
        password: this.password,
        scope: this.scope,
      }, {
        headers: { "Content-Type": "application/json" },
      });

      this.token = response.data.access_token;
      this.tokenExpiration = Date.now() + response.data.expires_in * 1000;
      this.api.defaults.headers.common["Authorization"] = `Bearer ${this.token}`;
      return this.token;
    } catch (err) {
      console.error("erreur: ", err);
      return null;
    }
  }

  async verifyToken(): Promise<void> {
    if (!this.token || Date.now() > (this.tokenExpiration ?? 0)) {
      await this.getToken();
    }
  }

  async getTickets(): Promise<TicketData[] | null> {
    await this.verifyToken();
    try {
      const res = await this.api.get<TicketData[]>("/Assistance/Ticket", {
        params: { limit: 3 },
      });
      console.log(res.data);
      return res.data;
    } catch {
      console.log("No ticket found");
      return null;
    }
  }

  async getTicket(id: number): Promise<TicketData | null> {
    await this.verifyToken();
    try {
      const res = await this.api.get<TicketData>(`/Assistance/Ticket/${id}`);
      return res.data;
    } catch {
      console.log("No ticket found");
      return null;
    }
  }

  async delete(id: number): Promise<unknown | null> {
    await this.verifyToken();
    try {
      const res = await this.api.delete(`/Assistance/Ticket/${id}`);
      console.log("Ticket deleted");
      return res.data;
    } catch {
      console.log("Error: not deleted");
      return null;
    }
  }

  async create(ticket: TicketData): Promise<unknown | null> {
    await this.verifyToken();

    const tic = new Ticket(ticket);
    if (!tic.name && !tic.category) {
      return null;
    }

    if (tic.category === 0 || !tic.location) {
      console.log("Aucun problème mentionné ou aucune demande d'insistance");
      return null;
    }

    const data = new FormData();
    data.append("name", tic.getName());
    data.append("content", tic.getContent());
    data.append("urgency", String(tic.getUrgency()));
    data.append("impact", String(tic.getImpact()));
    data.append("type", "1");
    data.append("category", String(tic.getCategory()));
    data.append("location", tic.getLocation());
    data.append("request_type", "1");

    try {
      const res = await this.api.post("/Assistance/Ticket", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Ticket created: ", res.data);
      return res.data;
    } catch {
      console.log("Error: not created");
      return null;
    }
  }
}

export default TicketManager;