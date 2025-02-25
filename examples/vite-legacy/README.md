# Sign in with Aptos - Vite Legacy Example

This example demonstrates how to implement Sign in with Aptos (SIWA) authentication in a React application using the legacy approach.

## Overview

This legacy example showcases:

- How to integrate SIWA in a React frontend using the traditional `connect` + `signMessage` flow
- How to handle authentication flows with the legacy approach
- How to connect with the backend for verification
- A comparison point with the newer, streamlined SIWA approach

## Getting Started

### Prerequisites

- Node.js (version specified in the root `.tool-versions` file)
- pnpm package manager

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

1. Start the example application:

```bash
# From the repository root
pnpm vite-legacy-example

# Or from this directory
pnpm dev
```

2. Open your browser and navigate to [http://localhost:5173](http://localhost:5173)

## Environment Variables

The example uses environment variables for configuration:

```
# .env file
VITE_BACKEND_URL=http://localhost:3000
```

You can copy the `.env.example` file to create your own `.env` file:

```bash
cp .env.example .env
```

## Legacy vs Modern Approach

This example demonstrates the legacy approach to authentication with Aptos wallets, which involves:

1. Connecting to the wallet
2. Requesting a signature for a message
3. Verifying the signature on the backend

In contrast, the modern SIWA approach (demonstrated in the [Vite example](../vite/README.md)) simplifies this to a single `signIn` method call.

## Learn More

For more information about Sign in with Aptos, check out:

- [SIWA Documentation](https://siwa.aptos.dev/)
- [Modern Vite Example](../vite/README.md)
- [Backend Example](../backend/README.md)
