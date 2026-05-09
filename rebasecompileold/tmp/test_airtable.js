const pat = "patqFN6jZJqxz1Z2S.1d975745bf7bf2e5a4f84f1a5a58bbd11990bce05fb6bc648df3e305724f35b2";
const baseId = "appMGHhWS1cfYgwIO";
const tableName = "Settings";
const fs = require('fs');

async function test() {
    const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;
    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${pat}` }
        });
        const data = await response.json();
        fs.writeFileSync('c:\\laragon\\www\\coinbase001\\tmp\\temp_node_resp.txt', JSON.stringify(data, null, 2), 'utf8');
        console.log("Written to temp_node_resp.txt");
    } catch (error) {
        console.error("Error fetching Airtable settings:", error);
    }
}

test();
