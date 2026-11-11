export class ChannelProvider {
  constructor(name) { this.name = name; }
  async send() { throw new Error("ChannelProvider.send must be implemented."); }
}

export class SimulatorChannelProvider extends ChannelProvider {
  constructor(channel = "USSD") { super(`${channel.toUpperCase()} simulator`); this.channel = channel.toUpperCase(); }
  async send({ screen, commands = [] }) {
    const body = [screen, ...commands].join("\n").slice(0, this.channel === "SMS" ? 612 : 900);
    return {
      channel: this.channel,
      delivered: false,
      simulated: true,
      receipt: `SIMULATED / NOT SENT / ${this.channel}`,
      body,
    };
  }
}

export function createLowTechScreen(title, items, page = 0, pageSize = 7) {
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const boundedPage = Math.max(0, Math.min(page, pages - 1));
  const visible = items.slice(boundedPage * pageSize, boundedPage * pageSize + pageSize);
  return {
    page: boundedPage,
    pages,
    text: [`FAITHAI ${title}`, ...visible.map((item, index) => `${index + 1}. ${item}`), "0. BACK", pages > 1 ? `9. NEXT (${boundedPage + 1}/${pages})` : ""].filter(Boolean).join("\n"),
  };
}
