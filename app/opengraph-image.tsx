import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'GridTokenX Trading Platform'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 128,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 40,
        }}
      >
        <span style={{ fontWeight: 'bold' }}>GridTokenX</span>
      </div>
      <div
        style={{
          fontSize: 48,
          opacity: 0.9,
          textAlign: 'center',
          padding: '0 80px',
        }}
      >
        P2P Energy Trading on Solana
      </div>
      <div
        style={{
          fontSize: 32,
          opacity: 0.7,
          marginTop: 20,
        }}
      >
        Futures • Options • Earn • Borrow
      </div>
    </div>,
    {
      ...size,
    }
  )
}
