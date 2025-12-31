import { DataTypes } from "sequelize";
import { sequelize } from "../util/db";
/*
Table 1: files (Core Metadata)
This table acts as the "Source of Truth" for every uploaded file. 
id (UUID/BIGINT): Primary key. UUIDs are preferred in 2025 for better security and distributed system compatibility.
original_name (VARCHAR): The name of the file as uploaded by the user (e.g., my_resume.pdf).
storage_path (TEXT): The relative or absolute path on the disk (e.g., /uploads/2025/12/unique_file_id.pdf).
file_size (BIGINT): Size in bytes. Useful for enforcing quotas and displaying to users.
mime_type (VARCHAR): The file format (e.g., application/pdf, image/png) to help the browser handle downloads correctly.
hash (VARCHAR): A hash (MD5/SHA-256) of the file content. This helps detect duplicate uploads and ensure file integrity.
uploaded_at (TIMESTAMP): When the file was saved. Use TIMESTAMP WITH TIME ZONE as a baseline in 2025.
user_id (FOREIGN KEY): Link to the users table to track ownership.  */

export const Upload = sequelize.define("uploads", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  original_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  storage_path: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  file_size: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  mime_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  uploaded_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
});
