/** Discord signs every interaction (Ed25519 over timestamp + body); anything that doesn't verify is refused. */
const hex = (s: string) => Uint8Array.from(s.match(/../g) ?? [], (b) => parseInt(b, 16));

export async function verifyDiscord(publicKeyHex: string, signatureHex: string | null, timestamp: string | null, body: string): Promise<boolean> {
  if (!signatureHex || !timestamp) return false;
  try {
    const key = await crypto.subtle.importKey('raw', hex(publicKeyHex), { name: 'Ed25519' }, false, ['verify']);
    return await crypto.subtle.verify('Ed25519', key, hex(signatureHex), new TextEncoder().encode(timestamp + body));
  } catch {
    return false;
  }
}
