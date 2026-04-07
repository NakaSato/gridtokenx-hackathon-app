import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'GridTokenX Trading'
export const size = {
  width: 1200,
  height: 600,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 96,
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
          marginBottom: 30,
        }}
      >
        <span style={{ fontWeight: 'bold' }}>GridTokenX</span>
      </div>
      <div
        style={{
          fontSize: 40,
          opacity: 0.9,
          textAlign: 'center',
          padding: '0 60px',
        }}
      >
        Advanced Energy Trading on Solana
      </div>
    </div>,
    {
      ...size,
    }
  )
}
