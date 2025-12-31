import { DataTypes } from "sequelize";
import { sequelize } from "../util/db";

export const Dataset = sequelize.define("datasets", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  original_name: { type: DataTypes.STRING, allowNull: false },
  storage_path: { type: DataTypes.TEXT, allowNull: false },
  columns: { type: DataTypes.JSONB, allowNull: true }, // inferred headers/types
  row_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  uploaded_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});
