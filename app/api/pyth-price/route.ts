import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const tokenId = req.nextUrl.searchParams.get('id')

  // Use public Hermes API
  const url = `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${tokenId}&parsed=true&ignore_invalid_price_ids=true`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      return NextResponse.json(
        { error: `Hermes error ${res.status}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
