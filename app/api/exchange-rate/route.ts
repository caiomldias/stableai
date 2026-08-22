import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("https://api.frankfurter.app/latest?from=USD&to=BRL", { next: { revalidate: 86400 } });
    const result = await response.json() as { date?: string; rates?: { BRL?: number } };
    if (!response.ok || !result.rates?.BRL) throw new Error("Cotação indisponível");
    return NextResponse.json({ base: "USD", quote: "BRL", rate: result.rates.BRL, date: result.date });
  } catch {
    return NextResponse.json({ error: "Cotação temporariamente indisponível." }, { status: 503 });
  }
}
