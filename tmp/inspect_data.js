const pat = "patqFN6jZJqxz1Z2S.1d975745bf7bf2e5a4f84f1a5a58bbd11990bce05fb6bc648df3e305724f35b2";
const baseId = "appMGHhWS1cfYgwIO";
const fs = require('fs');

async function inspectData() {
    const url = `https://api.airtable.com/v0/${baseId}/Transactions?maxRecords=1`;
    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${pat}` }
        });
        const data = await response.json();
        fs.writeFileSync('c:\\laragon\\www\\coinbase001\\tmp\\transaction_sample.json', JSON.stringify(data, null, 2));
    } catch (error) {
        fs.writeFileSync('c:\\laragon\\www\\coinbase001\\tmp\\transaction_sample.json', JSON.stringify({ error: error.message }, null, 2));
    }
}

inspectData();
