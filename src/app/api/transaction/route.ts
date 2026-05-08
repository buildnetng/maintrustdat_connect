import { getAirtableRecordByWallet, getAirtableRecordsByWallet, saveWithdrawalToAirtable } from "@/lib/airtable";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const data = await req.json();

  const result = await saveWithdrawalToAirtable(data);
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
  const existingRecord: any = await getAirtableRecordsByWallet({ address, tableName: "Transactions" });
  console.log('[DEBUG] GET /api/transaction address=', address, 'found=', existingRecord?.length);
  return Response.json({ existingRecord });
}