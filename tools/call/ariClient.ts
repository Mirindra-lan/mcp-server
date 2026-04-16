import ariClient from "ari-client";

let ari: any;

// init ARI une seule fois
async function initAri() {
  if (ari) return ari;

  ari = await ariClient.connect(
    "http://192.168.0.28:8088",
    "avr",
    "avr"
  );

  ari.start("avr-app");

  return ari;
}