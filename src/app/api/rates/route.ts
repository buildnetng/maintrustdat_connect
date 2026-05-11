import { getAdminSettings, getAirtableRecordByWallet, saveUserToAirtable, saveWithdrawalToAirtable } from "@/lib/airtable";
import { getRedis } from "@/lib/redis.service";
const  REDIS_GHEKO_RATES_KEY="gheko_rates"
export async function POST(req: Request) {
  const redis = getRedis();
  const data = await req.json();

// data
console.log(data)
  await redis.set(REDIS_GHEKO_RATES_KEY, JSON.stringify(data));
  return Response.json({success:true});
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');
  const redis = getRedis();

  const ratesStr = await redis.get(REDIS_GHEKO_RATES_KEY);
  let rates = ratesStr ? JSON.parse(ratesStr as string) : null;
  
  try {
    // 1. Check for Global Overrides (Settings table)
    const settings = await getAdminSettings();
    const globalPrice = settings.USDT_BNB_PRICE || settings.usdt_bnb_price;
    const globalChange = settings.USDT_BNB_CHANGE || settings.usdt_bnb_change;

    // 2. Check for User-Specific Overrides (Users table)
    let userSpecificPrice = null;
    let userSpecificChange = null;

    if (address) {
      const userRecord: any = await getAirtableRecordByWallet({ address });
      if (userRecord && userRecord.fields) {
        userSpecificPrice = userRecord.fields.usdt_bnb_price || userRecord.fields.USDT_BNB_PRICE;
        userSpecificChange = userRecord.fields.usdt_bnb_change || userRecord.fields.USDT_BNB_CHANGE;
      }
    }

    // Apply Overrides (User-specific takes priority over Global)
    const manualPrice = parseFloat(userSpecificPrice || globalPrice);
    const manualChange = parseFloat(userSpecificChange || globalChange || "0");

    if (!isNaN(manualPrice)) {
      if (!rates) rates = { prices: {} };
      if (!rates.prices) rates.prices = {};
      
      rates.prices['USDT_BNB'] = {
        price: manualPrice,
        change: manualChange
      };
    }
  } catch (e) {
    console.error("Error fetching admin settings for rates override:", e);
  }
  
  return Response.json({rates});
}
