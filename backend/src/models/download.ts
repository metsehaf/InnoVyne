import { sequelize } from "../util/db";
import { DataTypes } from "sequelize";

/**id (BIGSERIAL): Primary key.
file_id (FOREIGN KEY): References files.id.
downloaded_at (TIMESTAMP): Tracking the exact moment of each download.
user_id (FOREIGN KEY): If tracking which specific users downloaded the file.
ip_address (INET): For security monitoring and rate limiting.
 */

export const Download = sequelize.define("downloads", {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  file_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: "files",
      key: "id",
    },
  },
  downloaded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  ip_address: {
    type: DataTypes.INET,
    allowNull: true,
  },
});
