# Default recipe to list available recipes
default:
    @just --list

# Start development server
dev:
    bun run dev

# Production build
build:
    bun run build

# Build WASM module (required for crypto/pricing features)
build-wasm:
    bun run build:wasm

# Start production server
start:
    bun run start

# Run unit tests
test:
    bun run test

# Run Playwright end-to-end tests
test-e2e:
    bun run test:e2e

# Run ESLint
lint:
    bun run lint

# Format code with Prettier
format:
    bun run format

# Bundle analysis
analyze:
    bun run analyze

# Clean build artifacts
clean:
    bun run clean
