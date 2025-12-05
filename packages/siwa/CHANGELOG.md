# @aptos-labs/siwa

## 0.5.2

### Patch Changes

- de6de19: Force signing message bytes conversion

## 0.5.1

### Patch Changes

- aa36448: Add vite and webpack ignore when dynamically importing x-chain dependencies.

## 0.5.0

### Minor Changes

- 75ef107: Make serializers async and add support for x-chain public keys. Deprecate old serialization versions without reverse compatibility.

## 0.4.0

### Minor Changes

- 2969f01: breaking: Removed v1 serialization for `serializeSignInOutput` and `deserializeSignInOutput`

## 0.3.0

### Minor Changes

- cf1ffa3: Separated out signature verification with input validation
- da9fc9d: Bump @aptos-labs/wallet-standard to 0.5.0

### Patch Changes

- cf1ffa3: Add verification step to compare the `PublicKey`'s derived address to the message address

## 0.2.5

### Patch Changes

- 64510d4: Update `getSignInPublicKeyScheme` to support object instances
- 64510d4: Renamed `verifyLegacySignIn`'s `output.fullMessage` to `output.message`

## 0.2.4

### Patch Changes

- 33448ab: Export types from @aptos-labs/wallet-standard

## 0.2.3

### Patch Changes

- 2d19b1a: Export wallet-standard types from @aptos-labs/siwa

## 0.2.2

### Patch Changes

- 093f05c: Add utilities for legacy message handling

## 0.2.1

### Patch Changes

- 41274e1: Fix export formats

## 0.2.0

### Minor Changes

- 0cf9c69: Bump minor release
