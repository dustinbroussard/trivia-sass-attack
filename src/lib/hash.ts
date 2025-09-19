const encoder = new TextEncoder();

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function getSubtleCrypto(): Promise<SubtleCrypto> {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  try {
    const nodeCrypto = await import('node:crypto');
    if (nodeCrypto.webcrypto?.subtle) {
      return nodeCrypto.webcrypto.subtle;
    }
  } catch (err) {
    console.warn('[hash] Unable to load node:crypto subtle implementation', err);
  }
  throw new Error('WebCrypto not available');
}

export async function sha256(text: string): Promise<string> {
  const subtle = await getSubtleCrypto();
  const digest = await subtle.digest('SHA-256', encoder.encode(text));
  return bufferToHex(digest);
}
