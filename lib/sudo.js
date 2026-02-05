// sudo.js - Single correct version
require("dotenv").config();

const { Pool } = require("pg");
const s = require("../set"); // Make sure this path is correct

// Use DATABASE_URL from config or default
var dbUrl = s.DATABASE_URL ? s.DATABASE_URL : "postgres://db_7xp9_user:6hwmTN7rGPNsjlBEHyX49CXwrG7cDeYi@dpg-cj7ldu5jeehc73b2p7g0-a.oregon-postgres.render.com/db_7xp9";

const proConfig = {
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false,
  },
};

const pool = new Pool(proConfig);

// Create sudo table
async function createSudoTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS sudo (
        id serial PRIMARY KEY,
        jid text NOT NULL UNIQUE
      );
    `);
    console.log("✅ Sudo table created/verified successfully.");
  } catch (error) {
    console.error("❌ Error creating sudo table:", error);
  } finally {
    client.release();
  }
}

// Initialize table
createSudoTable();

// Check if number is sudo
async function issudo(jid) {
  const client = await pool.connect();
  try {
    const query = "SELECT EXISTS (SELECT 1 FROM sudo WHERE jid = $1)";
    const values = [jid];
    const result = await client.query(query, values);
    return result.rows[0].exists;
  } catch (error) {
    console.error("❌ Error checking sudo:", error);
    return false;
  } finally {
    client.release();
  }
}

// Remove sudo number
async function removeSudoNumber(jid) {
  const client = await pool.connect();
  try {
    const query = "DELETE FROM sudo WHERE jid = $1";
    const values = [jid];
    await client.query(query, values);
    console.log(`✅ Phone number ${jid} removed from sudo list.`);
    return true;
  } catch (error) {
    console.error("❌ Error removing sudo number:", error);
    return false;
  } finally {
    client.release();
  }
}

// Add sudo number
async function addSudoNumber(jid) {
  const client = await pool.connect();
  try {
    // Check if already exists
    const checkQuery = "SELECT EXISTS (SELECT 1 FROM sudo WHERE jid = $1)";
    const checkResult = await client.query(checkQuery, [jid]);
    
    if (checkResult.rows[0].exists) {
      console.log(`⚠️ Phone number ${jid} is already sudo.`);
      return false;
    }
    
    // Add if not exists
    const query = "INSERT INTO sudo (jid) VALUES ($1)";
    const values = [jid];
    await client.query(query, values);
    console.log(`✅ Phone number ${jid} added to sudo list.`);
    return true;
  } catch (error) {
    console.error("❌ Error adding sudo number:", error);
    return false;
  } finally {
    client.release();
  }
}

// Get all sudo numbers
async function getAllSudoNumbers() {
  const client = await pool.connect();
  try {
    const query = "SELECT jid FROM sudo";
    const result = await client.query(query);
    const sudoNumbers = result.rows.map((row) => row.jid);
    return sudoNumbers;
  } catch (error) {
    console.error("❌ Error getting sudo numbers:", error);
    return [];
  } finally {
    client.release();
  }
}

// Check if sudo table is empty
async function isSudoTableNotEmpty() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT COUNT(*) FROM sudo');
    const rowCount = parseInt(result.rows[0].count);
    return rowCount > 0;
  } catch (error) {
    console.error('❌ Error checking sudo table:', error);
    return false;
  } finally {
    client.release();
  }
}

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("✅ Database connection successful");
    client.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
}

// Test connection on startup
testConnection();

module.exports = {
  issudo,
  addSudoNumber,
  removeSudoNumber,
  getAllSudoNumbers,
  isSudoTableNotEmpty,
  testConnection
};