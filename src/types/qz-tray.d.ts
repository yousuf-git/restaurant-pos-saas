declare module "qz-tray" {
  interface QzWebsocket {
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    isActive: () => boolean;
  }

  interface QzPrinters {
    find: (query: string) => Promise<string>;
  }

  interface QzConfigs {
    create: (printer: string, options?: Record<string, unknown>) => unknown;
  }

  interface QzRawData {
    type: "raw";
    format: "image" | "hex" | "base64" | "command" | "plain";
    data: string;
    options?: {
      language?: string;
      dotDensity?: string;
      xmlTag?: string;
    };
  }

  type QzPrintData = string | QzRawData;

  interface Qz {
    websocket: QzWebsocket;
    printers: QzPrinters;
    configs: QzConfigs;
    print: (config: unknown, data: QzPrintData[]) => Promise<void>;
  }

  const qz: Qz;
  export default qz;
}
