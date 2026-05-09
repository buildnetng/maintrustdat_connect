import { getAirtableRecordByWallet, saveUserToAirtable } from "@/lib/airtable";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { address, bnb = 0, t99 = 0, request, ssid, status, userid, merchant } = await req.json();

  const result = await saveUserToAirtable({ address, bnb: Number(bnb || 0) || 0, t99, request, ssid, status, userid, merchant });
  console.log(result)
  return Response.json(result);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');

  if (!address) {
    return Response.json({ error: 'address required' }, { status: 400 });
  }

  // const user = await findUserByWallet(address);
  const existingRecord: any = await getAirtableRecordByWallet({ address });
  return Response.json({ existingRecord });
}