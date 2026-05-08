// import { saveUser, findUserByWallet } from '@/lib/airtable';

import { saveUserToAirtable } from "@/lib/airtable";

export async function POST(req: Request) {
  const { address, bnb, t99 } = await req.json();

  const result = await saveUserToAirtable({address, bnb, t99});

  return Response.json(result);
}

// export async function GET(req: Request) {
//   const { searchParams } = new URL(req.url);
//   const address = searchParams.get('address');

//   if (!address) {
//     return Response.json({ error: 'address required' }, { status: 400 });
//   }

//   const user = await findUserByWallet(address);
//   return Response.json(user);
// }
