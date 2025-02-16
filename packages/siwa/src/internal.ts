/**
 * @internal
 *
 * Type with a numeric `length` and numerically indexed elements of a generic type `T`.
 *
 * For example, `Array<T>` and `Uint8Array`.
 *
 * @group Internal
 */
export interface Indexed<T> {
  length: number;
  [index: number]: T;
}

/**
 * @internal
 *
 * Efficiently compare {@link Indexed} arrays (e.g. `Array` and `Uint8Array`).
 *
 * @param a An array.
 * @param b Another array.
 * @param excludedValues Values to exclude from `a` the comparison.
 *
 * @return `true` if the arrays have the same length and elements, `false` otherwise.
 *
 * @group Internal
 */
export function arraysEqual<T>(
  a: Indexed<T>,
  b: Indexed<T>,
  excludedValues?: T[],
): boolean {
  if (a === b) return true;

  const length = a.length;
  if (length !== b.length) return false;

  for (let i = 0; i < length; i++) {
    if (excludedValues?.includes(a[i])) continue;
    if (a[i] !== b[i]) return false;
  }

  return true;
}

/**
 * @internal
 *
 * Encode a `Uint8Array` to a base64 string.
 *
 * @param bytes A `Uint8Array` to encode.
 *
 * @returns A base64 encoded string.
 *
 * @group Internal
 */
export function encodeBase64(bytes: Uint8Array): string {
  const base64Alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  for (let i = 0; i < bytes.byteLength; i += 3) {
    let buffer = 0;
    let bufferBitSize = 0;
    for (let j = 0; j < 3 && i + j < bytes.byteLength; j++) {
      buffer = (buffer << 8) | bytes[i + j];
      bufferBitSize += 8;
    }
    for (let j = 0; j < 4; j++) {
      if (bufferBitSize >= 6) {
        result += base64Alphabet[(buffer >> (bufferBitSize - 6)) & 0x3f];
        bufferBitSize -= 6;
      } else if (bufferBitSize > 0) {
        result += base64Alphabet[(buffer << (6 - bufferBitSize)) & 0x3f];
        bufferBitSize = 0;
      }
    }
  }
  return result;
}
