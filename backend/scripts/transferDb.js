const mongoose = require("mongoose");
// mongoose from "mongoose";

const localDB = "mongodb://localhost:27017/school_management";
const atlasDB = "mongodb+srv://riteshgangster420:285ZzkrwNKe9j2jv@cluster0.6a1ot5u.mongodb.net/schoolManagement";

async function connectDB(connection, name) {
  return new Promise((resolve, reject) => {
    connection.once("open", () => {
      console.log(`✅ Connected to ${name}`);
      resolve();
    });
    connection.on("error", (err) => {
      console.error(`❌ ${name} connection error:`, err);
      reject(err);
    });
  });
}

async function migrate() {
  try {
    const local = mongoose.createConnection(localDB);
    const atlas = mongoose.createConnection(atlasDB);

    // ✅ Wait for both connections
    await Promise.all([
      connectDB(local, "Local DB"),
      connectDB(atlas, "Atlas DB"),
    ]);

    // ✅ Get all collections
    const collections = await local.db.listCollections().toArray();

    if (collections.length === 0) {
      console.log("⚠️ No collections found in local DB");
      return process.exit();
    }

    // 🔁 Transfer each collection
    for (const col of collections) {
      const name = col.name;

      const data = await local.db.collection(name).find().toArray();

      if (data.length === 0) {
        console.log(`⏭️ Skipped empty collection: ${name}`);
        continue;
      }

      // ⚠️ Optional: clear existing data to avoid duplicates
      await atlas.db.collection(name).deleteMany({});

      await atlas.db.collection(name).insertMany(data);

      console.log(`✔️ Transferred: ${name} (${data.length} docs)`);
    }

    console.log("🎉 Migration completed successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrate();