const pat = "patqFN6jZJqxz1Z2S.1d975745bf7bf2e5a4f84f1a5a58bbd11990bce05fb6bc648df3e305724f35b2";
const baseId = "appMGHhWS1cfYgwIO";
const fs = require('fs');

async function checkTables() {
    const results = {};
    const tables = ["users", "Transactions", "rates", "Settings"];
    for (const table of tables) {
        const url = `https://api.airtable.com/v0/${baseId}/${table}?maxRecords=1`;
        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${pat}` }
            });
            const data = await response.json();
            if (data.records && data.records.length > 0) {
                results[table] = Object.keys(data.records[0].fields);
            } else {
                results[table] = "Empty or error: " + JSON.stringify(data.error || "Empty");
            }
        } catch (error) {
            results[table] = "Error: " + error.message;
        }
    }
    fs.writeFileSync('c:\\laragon\\www\\coinbase001\\tmp\\table_analysis.json', JSON.stringify(results, null, 2));
}

checkTables();
