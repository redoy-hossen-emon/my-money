import dns from "node:dns";
import { MongoClient } from "mongodb";

// Some Windows/network DNS resolvers refuse MongoDB Atlas SRV lookups.
// Use configurable resolvers for mongodb+srv while keeping the default public options useful locally.
const dnsServers = (process.env.MONGODB_DNS_SERVERS || "1.1.1.1,8.8.8.8")
  .split(",")
  .map((server) => server.trim())
  .filter(Boolean);
dns.setServers(dnsServers);

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable");
}

const options = {};
let client;
let clientPromise;

async function resolveMongoUri() {
  if (!uri.startsWith("mongodb+srv://")) return uri;

  const parsedUri = new URL(uri);
  const [srvRecords, txtRecords] = await Promise.all([
    dns.promises.resolveSrv(`_mongodb._tcp.${parsedUri.hostname}`),
    dns.promises.resolveTxt(parsedUri.hostname).catch((error) => {
      if (error.code === "ENODATA" || error.code === "ENOTFOUND") return [];
      throw error;
    }),
  ]);

  const params = new URLSearchParams(parsedUri.search);
  for (const option of txtRecords.flat().join("").split("&")) {
    const [key, value] = option.split("=");
    if (key && !params.has(key)) params.set(key, value);
  }
  params.set("tls", "true");

  const credentials = `${parsedUri.username}:${parsedUri.password}`;
  const hosts = srvRecords.map(({ name, port }) => `${name}:${port}`).join(",");
  return `mongodb://${credentials}@${hosts}${parsedUri.pathname}?${params}`;
}

async function connectClient() {
  const resolvedUri = await resolveMongoUri();
  client = new MongoClient(resolvedUri, options);
  await client.connect();
  console.log("MongoDB connected successfully");
  return client;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = connectClient();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = connectClient();
}

export default clientPromise;