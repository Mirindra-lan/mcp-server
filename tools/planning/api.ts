import axios from "axios";
import https from "https";

const TT_URL = process.env.TT_URL;

if (!TT_URL) {
  throw new Error("TT_URL not configured");
}

/**
 * Axios instance centralisée pour TT API
 */
export default axios.create({
  baseURL: TT_URL,
  timeout: 10000,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false, // équivalent à strictSSL:false
  }),
  headers: {
    "Content-Type": "application/json",
  },
});