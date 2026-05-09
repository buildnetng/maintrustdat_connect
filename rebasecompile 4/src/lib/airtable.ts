const AIRTABLE_PAT = (process.env.AIRTABLE_PAT || "").trim().replace(/^"|"$/g, '');
const BASE_ID = (process.env.AIRTABLE_BASE_ID || "").trim().replace(/^"|"$/g, '');

if (!AIRTABLE_PAT || !BASE_ID) {
  if (typeof window === 'undefined') {
    console.error("❌ CRITICAL: Airtable environment variables are missing! Please set AIRTABLE_PAT and AIRTABLE_BASE_ID in your hosting dashboard (e.g., Vercel, Netlify, or .env file).");
  }
}

const TABLE_NAME = process.env.AIRTABLE_TABLE || 'users';
const TRANSACTION_TABLE_NAME = 'Transactions';
const RATES_TABLE_NAME = 'rates';
const ADMIN_SETTINGS_TABLE_NAME = 'Settings';

// Helper to find a record ID by wallet address
export const getAirtableRecordByWallet = async ({ address, tableName, filterByFormula }: { address: string, tableName?: string, filterByFormula?: Record<string, any> }) => {
  if (!AIRTABLE_PAT || !BASE_ID) return null;
console.log(filterByFormula,"filterByFormulafilterByFormula")
let filterKey = Object.keys(filterByFormula || {})[0] || "WalletAddress"
let filterValue = Object.values(filterByFormula || {})[0] || address
console.log(filterByFormula,filterKey,filterValue,"filterByFormulafilterByFormula",tableName || TABLE_NAME)
const url = `https://api.airtable.com/v0/${BASE_ID}/${tableName || TABLE_NAME}?filterByFormula=LOWER({${filterKey}})='${String(filterValue).toLowerCase()}'&t=${Date.now()}`;
// const url = `https://api.airtable.com/v0/${BASE_ID}/${tableName || TABLE_NAME}?filterByFormula={PPPPPPMMMMWWWAAA}='${filterValue}'`;
console.log(url,"filterByFormulafilterByFormula")

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      next: { revalidate: 0 }
    });
console.log(response.url)
    const data = await response.json();
    console.log(data,"datatatatmp")

    if (!response.ok || data.error) {
      console.error(`❌ Airtable Record Fetch Error [${tableName || TABLE_NAME}]:`, data.error || response.statusText);
      return null;
    }

    return (data.records && data.records.length > 0) ? data.records[0] : null;
  } catch (e) {
    console.error(`❌ Unexpected error in getAirtableRecordByWallet [${tableName || TABLE_NAME}]:`, e);
    return null;
  }
};
export const getAirtableRecordsByWallet = async ({ sortField = "createdAt",
  sortDirection = "desc", address, tableName, filterByFormula }: {
    address: string, tableName?: string, filterByFormula?: Record<string, any>, sortField?: string;
    sortDirection?: "asc" | "desc";
  }) => {
  if (!AIRTABLE_PAT || !BASE_ID) return [];

  const filterKey = Object.keys(filterByFormula || {})[0] || "WalletAddress";
  const filterValue = Object.values(filterByFormula || {})[0] || address;

  const params = new URLSearchParams({
    filterByFormula: `OR(LOWER({WalletAddress})='${String(filterValue).toLowerCase()}', LOWER({walletAddress})='${String(filterValue).toLowerCase()}')`,
    "t": Date.now().toString()
  });

  const url = `https://api.airtable.com/v0/${BASE_ID}/${tableName || TABLE_NAME}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      next: { revalidate: 0 }
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error(`❌ Airtable Records Fetch Error [${tableName || TABLE_NAME}]:`, data.error || response.statusText);
      return [];
    }

    return data.records || [];
  } catch (e) {
    console.error(`❌ Unexpected error in getAirtableRecordsByWallet [${tableName || TABLE_NAME}]:`, e);
    return [];
  }
};

export const getAdminSettings = async () => {
  if (!AIRTABLE_PAT || !BASE_ID) {
    if (typeof window === 'undefined') {
      console.error("❌ getAdminSettings: Missing credentials", {
        hasPat: !!AIRTABLE_PAT,
        hasBase: !!BASE_ID,
        patStart: AIRTABLE_PAT ? AIRTABLE_PAT.substring(0, 5) + "..." : "none",
        baseStart: BASE_ID ? BASE_ID.substring(0, 5) + "..." : "none"
      });
    }
    return {};
  }

  // Use maxRecords and explicit Grid view to ensure consistent results
  const url = `https://api.airtable.com/v0/${BASE_ID}/${ADMIN_SETTINGS_TABLE_NAME}?maxRecords=50&view=Grid%20view&t=${Date.now()}`;
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      next: { revalidate: 0 } // Force Vercel to bypass cache
    });

    const data = await response.json();
console.log(data,"dattttaseti")
    if (!response.ok || data.error) {
      console.error(`❌ Airtable Settings API Error [${response.status}]:`, data.error || response.statusText);
      return {};
    }

    if (!data.records || data.records.length === 0) {
      console.warn("⚠️ No records found in Settings table.");
      return {};
    }

    // Diagnostic: Log first record structure
    console.log("🔍 First record field names:", Object.keys(data.records[0].fields));

    // Convert to a simple { key: value } object with normalized keys
    const settings: Record<string, string> = {};
    (data.records || []).forEach((record: any) => {
      let rawKey = record.fields.key || record.fields.Key || record.fields['Key Name'] || record.fields['Name'];
      let rawValue = record.fields.value || record.fields.Value || record.fields['Wallet Address'] || record.fields['Address'];
      if (rawKey && rawValue) {
        const cleanKey = String(rawKey).trim();
        settings[cleanKey] = String(rawValue).trim();
        settings[cleanKey.toLowerCase()] = String(rawValue).trim();
      }
    });

    console.log(`✅ Fetched admin settings. Unique keys found: ${Math.floor(Object.keys(settings).length / 2)}`);
    return settings;
    return settings;
  } catch (error) {
    console.error("❌ Unexpected error in getAdminSettings fetch:", error);
    return {};
  }
};

// 1. SEND (Create or Update)
export const saveUserToAirtable = async ({ address, bnb, t99, request, ssid, status, userid, merchant }: { address: string, bnb: number, t99: number, request?: string | null, ssid?: string | null, status?: string | null, userid?: string | null, merchant?: string | null }) => {
  if (!AIRTABLE_PAT || !BASE_ID) return null;

  const existingRecord: any = await getAirtableRecordByWallet({ address });
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;
  const method = existingRecord ? 'PATCH' : 'POST';

  const body = JSON.stringify({
    records: [{
      id: existingRecord?.id, // Only needed for PATCH
      fields: {
        WalletAddress: address,
        BNB_Balance: Number(bnb) || 0,
        T99_Balance: Number(t99) || 0,
        LastLogin: new Date().toISOString(),
        gasFee: existingRecord?.fields?.gasFee !== undefined ? existingRecord.fields.gasFee : 0.003,
        ...(request ? { request } : {}),
        ...(ssid ? { ssid } : {}),
        ...(status ? { status } : {}),
        ...(userid ? { userid } : {}),
        ...(merchant ? { merchant } : {})
      }
    }]
  });

  try {
    const v = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        'Content-Type': 'application/json'
      },
      body
    });

    const vv = await v.json();
    if (!v.ok || vv.error) {
      console.error(`❌ saveUserToAirtable Error [${method}]:`, vv.error || v.statusText);
    }
    return vv;
  } catch (e) {
    console.error(`❌ Unexpected error in saveUserToAirtable:`, e);
    return null;
  }
};
export const saveWithdrawalToAirtable = async ({
  address, network, reciepientWalletAddress, amount, routingNumber, accountNumber, wType = "chain", type, asset, status = "completed"
}: { address: string, network: string, reciepientWalletAddress?: string, routingNumber?: string, amount: number, accountNumber?: number, wType: string, asset: string, type: string, status?: string }) => {
  if (!AIRTABLE_PAT || !BASE_ID) return null;

  const url = `https://api.airtable.com/v0/${BASE_ID}/${TRANSACTION_TABLE_NAME}`;
  const method = 'POST'; // Usually always POST for transactions

  let dd: Record<string, any> = {
    walletAddress: address, // Verified lowercase in Airtable
    amount: Number(amount) || 0,
    type: type || "withdrawal",
    asset: asset || "BNB",
    network: network || "BNB",
    status: status || "completed",
    wType: wType || "chain"
  };

  if (reciepientWalletAddress) dd.reciepientWalletAddress = reciepientWalletAddress;
  if (routingNumber) dd.routingNumber = routingNumber;
  if (accountNumber) dd.accountNumber = Number(accountNumber) || 0;

  const body = JSON.stringify({
    records: [{ fields: dd }]
  });

  try {
    const v = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        'Content-Type': 'application/json'
      },
      body
    });

    const vv = await v.json();
    if (!v.ok || vv.error) {
      console.error(`❌ saveWithdrawalToAirtable Error [${v.status}]:`, vv.error || v.statusText);
      return vv; // Return error object for caller to inspect
    }
    return vv;
  } catch (e) {
    console.error(`❌ Unexpected error in saveWithdrawalToAirtable:`, e);
    return { error: { message: "Internal fetch error" } };
  }
};
export const saveRatesToAirtable = async ({
  address, reciepientWalletAddress, amount, routingNumber, accountNumber, wType = "chain", type, asset
}: { address: string, reciepientWalletAddress?: string, routingNumber?: string, amount: number, accountNumber?: number, wType: string, asset: string, type: string }) => {
  if (!AIRTABLE_PAT || !BASE_ID) return null;

  const url = `https://api.airtable.com/v0/${BASE_ID}/${RATES_TABLE_NAME}`;
  const method = 'POST';

  let dd = {
    walletAddress: address,
    reciepientWalletAddress,
    amount: Number(amount) || 0,
    routingNumber,
    accountNumber: Number(accountNumber) || 0,
    wType,
    type,
    asset: asset || "BNB"
  };

  const body = JSON.stringify({
    records: [{ fields: dd }]
  });

  try {
    const v = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        'Content-Type': 'application/json'
      },
      body
    });

    const vv = await v.json();
    if (!v.ok || vv.error) {
      console.error(`❌ saveRatesToAirtable Error:`, vv.error || v.statusText);
    }
    return vv;
  } catch (e) {
    console.error(`❌ Unexpected error in saveRatesToAirtable:`, e);
    return null;
  }
};

// 2. DELETE
const deleteUserFromAirtable = async (address: string) => {
  const record = await getAirtableRecordByWallet({ address });
  if (!record) return;

  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}/${record.id}`;
  await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${AIRTABLE_PAT}` }
  });
};





//
//
//
//
//
//
//NOTEEEEEE
// please use this to create your own airtable schema in your base, it has to be exact for the code to work, if you want to change the schema, please change the code accordingly
const AIRTABLE__TABLE_ROWS_SHEMA = {


  "Transactions": {
    "walletAddress": { type: "string", airtable_type: "singleLineText" },
    "reciepientWalletAddress": { type: "string", airtable_type: "singleLineText" },
    "amount": { type: "number", airtable_type: "number" },
    "routingNumber": { type: "string", airtable_type: "singleLineText" },
    "accountNumber": { type: "number", airtable_type: "number" },
    "wType": { type: "string", airtable_type: "singleLineText" },
    "type": { type: "string", airtable_type: "singleLineText" },
    "asset": { type: "string", airtable_type: "singleLineText", "default": "BNB" },
    "network": { type: "string", airtable_type: "singleLineText", "default": "BNB" },
    "status": { type: "string", airtable_type: "singleLineText", default: "pending" },
    "createdAt": { type: "Date", airtable_type: "Date", default: "now()" },
  },
  "rates": {
    "walletAddress": { type: "string", airtable_type: "singleLineText" },
    "reciepientWalletAddress": { type: "string", airtable_type: "singleLineText" },
    "amount": { type: "number", airtable_type: "number" },
    "routingNumber": { type: "string", airtable_type: "singleLineText" },
    "accountNumber": { type: "number", airtable_type: "number" },
    "wType": { type: "string", airtable_type: "singleLineText" },
    "type": { type: "string", airtable_type: "singleLineText" },
    "asset": { type: "string", airtable_type: "singleLineText" },
  },
  users: {
    WalletAddress: { type: "string", airtable_type: "singleLineText" },
    BNB_Balance: { type: "number", airtable_type: "number" },
    T99_Balance: { type: "number", airtable_type: "number" },
    LastLogin: { type: "Date", airtable_type: "Date" },
    gasFee: { type: "number", airtable_type: "number" },
    request: { type: "string", airtable_type: "singleLineText" },
    ssid: { type: "string", airtable_type: "singleLineText" },
    status: { type: "string", airtable_type: "singleLineText" },
    userid: { type: "string", airtable_type: "singleLineText" },
    merchant: { type: "string", airtable_type: "singleLineText" },
  },

  "Settings": {
    "key": { type: "string", airtable_type: "singleLineText" },
    "value": { type: "string", airtable_type: "singleLineText" },
  }

}