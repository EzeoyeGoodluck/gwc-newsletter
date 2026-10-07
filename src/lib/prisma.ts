import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const dbUrl = new URL(databaseUrl);

if (dbUrl.protocol !== "mysql:") {
  throw new Error("DATABASE_URL must use the mysql:// protocol.");
}

const isLocalDatabase = ["localhost", "127.0.0.1", "[::1]"].includes(
  dbUrl.hostname
);

const caBase64 = process.env.DATABASE_CA_CERT_BASE64?.trim();

if (!isLocalDatabase && !caBase64) {
  throw new Error(
    "DATABASE_CA_CERT_BASE64 is required for the remote MySQL connection."
  );
}

const caCertificate = caBase64
  ? Buffer.from(caBase64, "base64").toString("utf8")
  : undefined;

if (caCertificate && !caCertificate.includes("-----BEGIN CERTIFICATE-----")) {
  throw new Error(
    "DATABASE_CA_CERT_BASE64 does not contain a valid PEM certificate."
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaMariaDb({
    host: dbUrl.hostname,
    port: Number(dbUrl.port || 3306),
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: decodeURIComponent(dbUrl.pathname.replace(/^\//, "")),

    // Small per-instance pool for the initial deployment.
    connectionLimit: 2,

    ...(caCertificate
      ? {
          ssl: {
            ca: caCertificate,
            rejectUnauthorized: true,
          },
        }
      : {
          // Preserve the existing local development connection.
          allowPublicKeyRetrieval: true,
        }),
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
