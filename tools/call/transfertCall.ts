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

export async function callNumber(extension: string) {
  if (!/^\d{3,10}$/.test(extension)) {
    throw new Error("Invalid extension or number");
  }

  const ari = await initAri();

  const channel = await ari.channels.originate({
    endpoint: `PJSIP/${extension}`,
    app: "avr-app",
    callerId: "AVR Bot",
  });

  return {
    channelId: channel.id,
    extension,
  };
}

export  async function transferCallToExtension (extension: string) {
  if (!/^\d{3,5}$/.test(extension)) {
    throw new Error("Invalid extension");
  }

  const ari = await initAri();
  const channels = await ari.channels.list();

  const avrChannels = [];

  for (const ch of channels) {
    const res = await ari.channels.getChannelVar({
      channelId: ch.id,
      variable: "AVR_EXTEN",
    });

    if (res.value === "5070" && ch.state === "Up") {
      avrChannels.push(ch);
    }
  }

  if (avrChannels.length === 0) {
    throw new Error("No active calls on 5070");
  }

  for (const ch of avrChannels) {
    await ari.channels.continueInDialplan({
      channelId: ch.id,
      context: "demo",
      extension,
      priority: 1,
    });
  }

  return avrChannels.length;
};

export async function transferWithBridge(extension: string) {
  const ari = await initAri();

  const channels = await ari.channels.list();

  const avrChannels = channels.filter((ch: any) =>
    ch.variables?.AVR_EXTEN === "5070"
  );

  const bridge = await ari.bridges.create({ type: "mixing" });

  for (const ch of avrChannels) {
    await bridge.addChannel({ channel: ch.id });
  }

  const agent = await ari.channels.originate({
    endpoint: `PJSIP/${extension}`,
    app: "avr-app",
  });

  await bridge.addChannel({ channel: agent.id });
}