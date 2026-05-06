import axios from "axios";
import https from "https";
import ttApi from "./api";

export async function getUserTTplanning(startDate: string, endDate?: string, matricule?: number) {
  const ttUrl = process.env.TT_URL;
  if (!ttUrl) throw new Error("TT_URL not configured");

  const url = `${ttUrl}/planningapi/min_max_planning`;

  const res = await axios.get(url, {
    params: {
      date_debut: startDate,
      date_fin: endDate ? endDate : startDate,
      ...(matricule ? { matricule: matricule } : {})
    },
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    })
  });

  return res.data;
}

export async function getRangeTTplanning(startDate: string, endDate?: string) {
  const ttUrl = process.env.TT_URL;
  if (!ttUrl) throw new Error("TT_URL not configured");

  const url = `${ttUrl}/planningapi/min_max_planning`;

  const res = await axios.get(url, {
    params: {
      date_debut: startDate,
      date_fin: endDate ? endDate : startDate
    },
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    })
  });

  return res.data;
}