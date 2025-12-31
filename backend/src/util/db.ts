import { Sequelize } from "sequelize";

export const sequelize = new Sequelize("api", "me", "password", {
  dialect: "postgres",
  host: "localhost",
  port: 5432,
});
