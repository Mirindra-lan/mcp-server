interface TicketData {
  name?: string;
  content?: string;
  impact?: number;
  urgency?: number;
  location?: string;
  category?: number;
}

class Ticket {
  name?: string;
  content?: string;
  impact?: number;
  urgency?: number;
  location?: string;
  category?: number;

  constructor(ticket: string) {
    const ticketJson = this.jsonParser(ticket);
    if (ticketJson) {
      this.name = ticketJson.name;
      this.content = ticketJson.content;
      this.impact = ticketJson.impact;
      this.urgency = ticketJson.urgency;
      this.location = ticketJson.location;
      this.category = ticketJson.category;
    }
  }

  getName(): string | undefined {
    return this.name;
  }

  getContent(): string | undefined {
    return this.content;
  }

  getImpact(): number | undefined {
    return this.impact;
  }

  getUrgency(): number | undefined {
    return this.urgency;
  }

  getLocation(): string | undefined {
    return this.location;
  }

  getCategory(): number | undefined {
    return this.category;
  }

  private jsonParser(str: string): TicketData | null {
    const openIndex = str.lastIndexOf("{");
    const closeIndex = str.indexOf("}");
    let cleanJson = "";

    if (openIndex !== -1 && closeIndex !== -1) {
      cleanJson = str.slice(openIndex, closeIndex + 1);
    }

    if (!cleanJson) {
      return null;
    }

    try {
      const data: TicketData = JSON.parse(cleanJson);
      return data;
    } catch {
      return null;
    }
  }
}

export default Ticket;