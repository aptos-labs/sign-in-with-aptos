# Sign in with Aptos - Backend Example

This example demonstrates how to implement a backend server that verifies Sign in with Aptos (SIWA) authentication requests.

## Overview

This backend example showcases:

- How to verify SIWA authentication messages from clients
- How to manage user sessions after successful authentication
- How to implement secure authentication endpoints
- Best practices for server-side SIWA implementation

## Getting Started

### Prerequisites

- Node.js (version specified in the root `.tool-versions` file)
- `pnpm` package manager

### Installation

1. From the repository root, install dependencies:

```bash
pnpm install
```

2. Build the required packages:

```bash
pnpm build
```

### Running the Example

1. Start the backend server:

```bash
pnpm dev
```

2. The server will start on [http://localhost:3000](http://localhost:3000)

## Implementation Details

This backend example uses:

- [Hono](https://hono.dev/) - A lightweight web framework
- [@aptos-labs/siwa](../../packages/siwa/README.md) - For SIWA message verification

## Using with the Frontend Example

This backend is designed to work with the [Vite frontend example](../vite/README.md). To use them together:

1. Start this backend server
2. Start the Vite frontend example
3. The frontend will connect to this backend for authentication verification
