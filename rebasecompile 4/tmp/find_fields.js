const pat = "patqFN6jZJqxz1Z2S.1d975745bf7bf2e5a4f84f1a5a58bbd11990bce05fb6bc648df3e305724f35b2";
const baseId = "appMGHhWS1cfYgwIO";

async function findFields() {
    const table = "Transactions";
    const url = `https://api.airtable.com/v0/${baseId}/${table}?maxRecords=10`;

    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${pat}` }
        });
        const data = await response.json();
        console.log("Records found:", data.records?.length);
        if (data.records) {
            data.records.forEach((r, i) => {
                console.log(`Record ${i} fields:`, Object.keys(r.fields));
            });
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

findFields();
