import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const url = process.env.DATABASE_URL;

const parseDatabaseUrl = (connectionString: string) => {
  const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
  const match = connectionString.match(regex);

  if (!match) {
    throw new Error(
      "Invalid DATABASE_URL format. Expected: mysql://USER:PASSWORD@HOST:PORT/DATABASE",
    );
  }

  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4], 10),
    database: match[5],
  };
};

const dbConfig = parseDatabaseUrl(url!);

const adapter = new PrismaMariaDb({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
});

const prisma = new PrismaClient({
  adapter,
});

export { prisma };
