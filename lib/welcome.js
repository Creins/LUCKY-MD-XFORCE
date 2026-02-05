// lib/welcome.js - Improved version
require("dotenv").config();
const { Pool } = require("pg");
const s = require("../set");

// Database URL from config
var dbUrl = s.DATABASE_URL || "postgres://db_7xp9_user:6hwmTN7rGPNsjlBEHyX49CXwrG7cDeYi@dpg-cj7ldu5jeehc73b2p7g0-a.oregon-postgres.render.com/db_7xp9";

const proConfig = {
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false,
  },
};

const pool = new Pool(proConfig);

// Create events table
const creerTableevents = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        Id serial PRIMARY KEY,
        jid text UNIQUE NOT NULL,
        welcome text DEFAULT 'off',
        goodbye text DEFAULT 'off',
        antipromote text DEFAULT 'off',
        antidemote text DEFAULT 'off',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Events table created/verified successfully.");
  } catch (e) {
    console.error("❌ Error creating events table:", e);
  }
};

// Initialize table
creerTableevents();

// Update or insert event setting
async function attribuerUnevaleur(jid, row, valeur) {
    const client = await pool.connect();
    const validRows = ['welcome', 'goodbye', 'antipromote', 'antidemote'];
    const validValues = ['on', 'off'];

    // Validate inputs
    if (!validRows.includes(row)) {
        console.error(`❌ Invalid row: ${row}`);
        return false;
    }
    
    if (!validValues.includes(valeur)) {
        console.error(`❌ Invalid value: ${valeur}. Must be 'on' or 'off'`);
        return false;
    }

    try {
        // Check if jid exists
        const checkResult = await client.query('SELECT * FROM events WHERE jid = $1', [jid]);
        const jidExiste = checkResult.rows.length > 0;

        if (jidExiste) {
            // Update existing record
            await client.query(
                `UPDATE events SET ${row} = $1, updated_at = CURRENT_TIMESTAMP WHERE jid = $2`,
                [valeur, jid]
            );
            console.log(`✅ Updated ${row} to ${valeur} for group ${jid}`);
        } else {
            // Insert new record with default values
            const defaults = {
                welcome: 'off',
                goodbye: 'off',
                antipromote: 'off',
                antidemote: 'off'
            };
            defaults[row] = valeur;
            
            await client.query(
                `INSERT INTO events (jid, welcome, goodbye, antipromote, antidemote) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [jid, defaults.welcome, defaults.goodbye, defaults.antipromote, defaults.antidemote]
            );
            console.log(`✅ Created new record for ${jid} with ${row}=${valeur}`);
        }
        return true;
    } catch (error) {
        console.error("❌ Error updating events:", error);
        return false;
    } finally {
        client.release();
    }
}

// Retrieve event setting
async function recupevents(jid, row) {
    const client = await pool.connect();
    const validRows = ['welcome', 'goodbye', 'antipromote', 'antidemote'];
    
    if (!validRows.includes(row)) {
        console.error(`❌ Invalid row requested: ${row}`);
        return 'off';
    }
    
    try {
        const result = await client.query(`SELECT ${row} FROM events WHERE jid = $1`, [jid]);
        
        if (result.rows.length > 0) {
            return result.rows[0][row] || 'off';
        } else {
            // Return default value if no record exists
            return 'off';
        }
    } catch (error) {
        console.error(`❌ Error retrieving ${row} for ${jid}:`, error);
        return 'off';
    } finally {
        client.release();
    }
}

// Get all event settings for a group
async function getAllEvents(jid) {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM events WHERE jid = $1', [jid]);
        
        if (result.rows.length > 0) {
            return result.rows[0];
        } else {
            // Return default settings
            return {
                jid: jid,
                welcome: 'off',
                goodbye: 'off',
                antipromote: 'off',
                antidemote: 'off'
            };
        }
    } catch (error) {
        console.error(`❌ Error getting all events for ${jid}:`, error);
        return null;
    } finally {
        client.release();
    }
}

// Test database connection
async function testConnection() {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        console.log("✅ Events database connection successful");
        return true;
    } catch (error) {
        console.error("❌ Events database connection failed:", error.message);
        return false;
    }
}

// Test connection on load
testConnection();

module.exports = {
    attribuerUnevaleur,
    recupevents,
    getAllEvents,
    testConnection
};