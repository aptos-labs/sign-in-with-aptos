# Sign in with Aptos - Vite Example

This example demonstrates how to implement Sign in with Aptos (SIWA) authentication in a React application built with Vite.

## Overview

This example showcases:

- How to integrate SIWA in a React frontend
- How to handle authentication flows
- How to connect with the backend for verification

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
pnpm vite-example

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

## Learn More

For more information about Sign in with Aptos, check out:

- [SIWA Documentation](https://siwa.aptos.dev/)
- [Backend Example](../backend/README.md)
