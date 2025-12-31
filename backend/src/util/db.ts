import dotenv from "dotenv";
import { Sequelize } from "sequelize";

dotenv.config(); // load .env into process.env

const {
  DATABASE_URL,
  DB_NAME = "api",
  DB_USER, // no default
  DB_PASS, // no default
  DB_HOST = "localhost",
  DB_PORT = "5432",
  DB_SSL,
  NODE_ENV,
  DB_DIALECT = "postgres",
} = process.env;

// fail fast if required vars are missing
if (!DATABASE_URL && (!DB_USER || !DB_PASS || !DB_HOST)) {
  throw new Error(
    "Missing required DB env vars (DB_USER, DB_PASS, DB_HOST) or DATABASE_URL"
  );
}

const port = Number(DB_PORT || "5432");

export const sequelize = DATABASE_URL
  ? new Sequelize(DATABASE_URL, {
      dialect: "postgres",
      dialectOptions:
        DB_SSL === "true"
          ? { ssl: { require: true, rejectUnauthorized: false } }
          : undefined,
      logging: NODE_ENV === "development" ? console.log : false,
    })
  : new Sequelize(DB_NAME, DB_USER!, DB_PASS!, {
      host: DB_HOST,
      port,
      dialect: DB_DIALECT as "postgres",
      logging: NODE_ENV === "development" ? console.log : false,
    });
