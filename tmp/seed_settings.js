const pat = "patqFN6jZJqxz1Z2S.1d975745bf7bf2e5a4f84f1a5a58bbd11990bce05fb6bc648df3e305724f35b2";
const baseId = "appMGHhWS1cfYgwIO";
const tableName = "Settings";

const settingsToSeed = [
    { key: "bnb_address", value: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" },
    { key: "eth_address", value: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" },
    { key: "btc_address", value: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" },
    { key: "gas_fee_address_eth", value: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" }
];

async function seed() {
    const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;

    // 1. Get existing records
    const listRes = await fetch(url, {
        headers: { Authorization: `Bearer ${pat}` }
    });
    const listData = await listRes.json();
    const existingRecords = listData.records || [];

    for (const item of settingsToSeed) {
        const existing = existingRecords.find(r => (r.fields.key || r.fields.Key) === item.key);

        if (existing) {
            console.log(`Updating ${item.key}...`);
            await fetch(`${url}/${existing.id}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${pat}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: {
                        value: item.value
                    }
                })
            });
        } else {
            console.log(`Creating ${item.key}...`);
            await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${pat}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    records: [{
                        fields: {
                            key: item.key,
                            value: item.value
                        }
                    }]
                })
            });
        }
    }
    console.log("Seeding complete!");
}

seed();
