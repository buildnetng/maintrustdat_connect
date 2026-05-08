const pat = "patqFN6jZJqxz1Z2S.1d975745bf7bf2e5a4f84f1a5a58bbd11990bce05fb6bc648df3e305724f35b2";
const baseId = "appMGHhWS1cfYgwIO";

async function checkTables() {
    const tables = ["users", "Transactions", "rates", "Settings"];
    for (const table of tables) {
        console.log(`--- Checking table: ${table} ---`);
        const url = `https://api.airtable.com/v0/${baseId}/${table}?maxRecords=1`;
        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${pat}` }
            });
            const data = await response.json();
            if (data.records && data.records.length > 0) {
                console.log(`Fields for ${table}:`, Object.keys(data.records[0].fields));
            } else {
                console.log(`No records found for ${table} to inspect fields.`);
            }
        } catch (error) {
            console.error(`Error checking ${table}:`, error);
        }
    }
}

checkTables();
