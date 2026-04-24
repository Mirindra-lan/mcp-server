import axios from "axios";

const ARI_URL = process.env.ARI_URL || "http://192.168.1.39:7070";
const ariClient = axios.create({
  baseURL: ARI_URL,
  headers: {
    "Content-Type": "application/json"
  }
});


export async function callNumber(extension: string) {
  if (!/^\d{3,10}$/.test(extension)) {
    throw new Error("Invalid extension or number");
  }
  return await ariClient.post("/call", {
    extension: extension, endpoint: `PJSIP/${extension}`
  });
}

export  async function transferCallToExtension (extension: string, uuid?: string) {
  if (!/^\d{3,10}$/.test(extension)) {
    throw new Error("Invalid extension or number");
  }
  return await ariClient.post("/transfert", {
    uuid: uuid,
    targetExtension: extension
  });
};