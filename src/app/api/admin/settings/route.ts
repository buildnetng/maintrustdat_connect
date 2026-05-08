import { getAdminSettings } from "@/lib/airtable";

export const dynamic = 'force-dynamic';

export async function GET() {
    const settings = await getAdminSettings();
    return Response.json(settings);
}
