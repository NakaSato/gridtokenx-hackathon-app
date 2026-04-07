import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { HELIUS_API_KEY, HELIUS_ENDPOINT } from '@/utils/const'

// GET handler
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const programId = searchParams.get('programId')

  if (!programId) {
    return NextResponse.json(
      { error: 'No programId parameter provided' },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(
      `${HELIUS_ENDPOINT}/${programId}/transactions?api-key=${HELIUS_API_KEY}`
    )
    
    if (!res.ok) {
      throw new Error(`Helius API error: ${res.status}`)
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
