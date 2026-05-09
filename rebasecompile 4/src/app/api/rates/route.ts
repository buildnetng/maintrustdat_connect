import { getAirtableRecordByWallet, saveUserToAirtable, saveWithdrawalToAirtable } from "@/lib/airtable";
import { getRedis } from "@/lib/redis.service";
const  REDIS_GHEKO_RATES_KEY="gheko_rates"

const redis = getRedis();
export async function POST(req: Request) {
  console.log("rateeeemop",req,)
  const data = await req.json();

// data
console.log("rateeeemop",data)
  await redis.set(REDIS_GHEKO_RATES_KEY, JSON.stringify(data));
  return Response.json({success:true});
}

export async function GET(req: Request) {
  const redis = getRedis();

  const rates = await redis.get(REDIS_GHEKO_RATES_KEY);
  
  
  return Response.json({rates:rates?JSON.parse(rates as string):null});
}