import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mymoney.app",
  appName: "My Money",
  webDir: "public",
  bundledWebRuntime: false,
  server: process.env.CAPACITOR_SERVER_URL
    ? {
        url: process.env.CAPACITOR_SERVER_URL,
        cleartext: process.env.CAPACITOR_SERVER_URL.startsWith("http://"),
      }
    : undefined,
};

export default config;