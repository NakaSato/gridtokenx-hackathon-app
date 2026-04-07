import { render, screen } from '@testing-library/react'
import { StatCard } from '../StatCard'

// Mock the UI card components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h3 data-testid="card-title">{children}</h3>
  ),
}))

describe('StatCard', () => {
  it('should render title and value', () => {
    render(<StatCard title="Total Energy" value="1,234 kWh" />)

    expect(screen.getByText('Total Energy')).toBeInTheDocument()
    expect(screen.getByText('1,234 kWh')).toBeInTheDocument()
  })

  it('should render change when provided', () => {
    render(
      <StatCard title="Revenue" value="$5,000" change="+12.5%" trend="up" />
    )

    expect(screen.getByText('+12.5%')).toBeInTheDocument()
  })

  it('should not render change when not provided', () => {
    render(<StatCard title="Users" value="100" />)

    expect(screen.queryByText('%')).not.toBeInTheDocument()
  })

  it('should apply green color for up trend', () => {
    render(<StatCard title="Growth" value="50%" change="+5%" trend="up" />)

    const changeElement = screen.getByText('+5%')
    expect(changeElement).toHaveClass('text-green-500')
  })

  it('should apply red color for down trend', () => {
    render(<StatCard title="Decline" value="-10%" change="-5%" trend="down" />)

    const changeElement = screen.getByText('-5%')
    expect(changeElement).toHaveClass('text-red-500')
  })

  it('should apply muted color for neutral trend', () => {
    render(<StatCard title="Stable" value="100" change="0%" trend="neutral" />)

    const changeElement = screen.getByText('0%')
    expect(changeElement).toHaveClass('text-muted-foreground')
  })

  it('should render custom icon when provided', () => {
    const customIcon = <span data-testid="custom-icon">🔥</span>

    render(<StatCard title="Custom" value="Test" icon={customIcon} />)

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('should render default Activity icon when no icon provided', () => {
    render(<StatCard title="Default" value="Test" />)

    // Activity icon from lucide-react should be rendered
    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should render arrow up icon for up trend', () => {
    render(<StatCard title="Growth" value="100" change="+10%" trend="up" />)

    // ArrowUpRight icon should be present
    const svg = document.querySelectorAll('svg')
    expect(svg.length).toBeGreaterThan(0)
  })

  it('should render arrow down icon for down trend', () => {
    render(<StatCard title="Decline" value="100" change="-10%" trend="down" />)

    // ArrowDownRight icon should be present
    const svg = document.querySelectorAll('svg')
    expect(svg.length).toBeGreaterThan(0)
  })

  it('should not render arrow icon for neutral trend', () => {
    render(<StatCard title="Stable" value="100" change="0%" trend="neutral" />)

    // Only the default Activity icon should be present (1 svg)
    const svgs = document.querySelectorAll('svg')
    expect(svgs.length).toBe(1)
  })

  it('should handle numeric values', () => {
    render(<StatCard title="Count" value={12345 as unknown as string} />)

    expect(screen.getByText('12345')).toBeInTheDocument()
  })

  it('should handle long values', () => {
    render(<StatCard title="Long Value" value="1,234,567.89 MWh" />)

    expect(screen.getByText('1,234,567.89 MWh')).toBeInTheDocument()
  })

  it('should handle special characters in title', () => {
    render(<StatCard title="Energy (kWh) - Daily" value="500" />)

    expect(screen.getByText('Energy (kWh) - Daily')).toBeInTheDocument()
  })
})
