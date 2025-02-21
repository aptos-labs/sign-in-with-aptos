# Sign in with Aptos

The "Sign in with Aptos" (SIWA) standard introduces a secure and user-friendly way for users to authenticate to off-chain resources by proving ownership of their Aptos account. It simplifies the authentication process by replacing the traditional connect + signMessage flow in the wallet standard with a streamlined one-click signIn method. SIWA leverages Aptos accounts to avoid reliance on traditional schemes like SSO while incorporating security measures to combat phishing attacks and improve user visibility.

## Getting Started

### Prerequisites

Check out [`.tool-versions`](.tool-versions) for runtime requirements.

### Installation

1. Clone the repository:

```bash
git clone https://github.com/aptos-labs/sign-in-with-aptos.git
cd sign-in-with-aptos
```

2. Install runtimes (mise)

```bash
mise install
```

If `mise` is not installed, check out their [Getting Started](https://mise.jdx.dev/getting-started.html) page.

3. Install dependencies:

```bash
pnpm install
```

4. Build packages:

```bash
pnpm build
```

### Development

#### Vite + Hono Example

From the root of the repository, run:

```bash
pnpm vite-example
```

This will start up both the Vite frontend and the Hono backend for SIWA using Turborepo.
