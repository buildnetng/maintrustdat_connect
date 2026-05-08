const pat = "patqFN6jZJqxz1Z2S.1d975745bf7bf2e5a4f84f1a5a58bbd11990bce05fb6bc648df3e305724f35b2";
const baseId = "appMGHhWS1cfYgwIO";

async function testPost() {
    const table = "Transactions";
    const url = `https://api.airtable.com/v0/${baseId}/${table}`;

    // Testing the current PascalCase payload that I suspect is failing
    const payload = {
        records: [{
            fields: {
                WalletAddress: "0xTest",
                Amount: 0.001,
                Type: "test",
                Asset: "BNB",
                Network: "BNB",
                Status: "completed"
            }
        }]
    };

    console.log("Testing POST to Transactions...");
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${pat}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

testPost();
