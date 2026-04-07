import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const tokenId = req.nextUrl.searchParams.get('id')
  const ago = req.nextUrl.searchParams.get('ago') || '24h'

  if (!tokenId) {
    return NextResponse.json(
      { error: 'Missing price feed ID' },
      { status: 400 }
    )
  }

  const hoursAgo = parseInt(ago.replace('h', ''), 10)
  const now = Math.floor(Date.now() / 1000)
  const targetTime = now - hoursAgo * 3600

  // Use public Hermes API
  const url = `https://hermes.pyth.network/v2/updates/price/${targetTime}?ids[]=${tokenId}&parsed=true&ignore_invalid_price_ids=true`

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
