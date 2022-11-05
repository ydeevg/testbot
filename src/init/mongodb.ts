import "dotenv/config";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);

export const mongodbConnect = async () => {
  await client.connect();
  console.log(">>> MongoDB session connection successfully");

  const db = client.db(process.env.MONGODB_DB!);

  return db;
}
