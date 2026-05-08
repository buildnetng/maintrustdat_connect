import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  context: { params: Promise<{ aba: string }> }
) {
  const { aba } = await context.params;

  try {
    const res = await fetch(
      `https://bankrouting.io/api/v1/aba/${aba}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { message: "Invalid ABA number" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data?.data || data);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch bank routing info" },
      { status: 500 }
    );
  }
}