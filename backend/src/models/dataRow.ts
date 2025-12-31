import { DataTypes } from "sequelize";
import { sequelize } from "../util/db";
import { Dataset } from "./dataset";

export const DataRow = sequelize.define("data_rows", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  dataset_id: { type: DataTypes.UUID, allowNull: false },
  data: { type: DataTypes.JSONB, allowNull: false }, // the row as an object
});
DataRow.belongsTo(Dataset, { foreignKey: "dataset_id" });
Dataset.hasMany(DataRow, { foreignKey: "dataset_id" });
