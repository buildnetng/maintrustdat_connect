import { getAirtableRecordByWallet, saveUserToAirtable, saveWithdrawalToAirtable } from "@/lib/airtable";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const result = await saveWithdrawalToAirtable(data);

    if (!result || result.error) {
      return Response.json({ error: result?.error || "Airtable save failed" }, { status: 500 });
    }

    return Response.json({
      success: true,
      record: (result.records && result.records[0]) ? result.records[0] : null
    });
  } catch (error: any) {
    console.error("❌ Withdrawal API Route Error:", error);
    return Response.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');

  if (!address) {
    return Response.json({ error: 'address required' }, { status: 400 });
  }

  // const user = await findUserByWallet(address);
  const existingRecord: any = await getAirtableRecordByWallet({ address, tableName: "Transactions" });
  console.log(existingRecord, "llllllll")
  return Response.json({ existingRecord });
}