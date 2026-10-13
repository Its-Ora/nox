// HMAC-SHA1 (hex) : WebCrypto si dispo, sinon implémentation JS pure (au cas où la webview n'est pas en contexte sécurisé).

const enc = new TextEncoder();

export async function hmacSha1Hex(key: string, msg: string): Promise<string> {
  const k = enc.encode(key);
  const m = enc.encode(msg);
  if (globalThis.crypto?.subtle) {
    try {
      const ck = await crypto.subtle.importKey('raw', k, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
      return hex(new Uint8Array(await crypto.subtle.sign('HMAC', ck, m)));
    } catch {
      /* on retombe sur la version JS */
    }
  }
  return hex(hmacJs(k, m));
}

function hex(b: Uint8Array) {
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

function hmacJs(key: Uint8Array, msg: Uint8Array): Uint8Array {
  const B = 64;
  if (key.length > B) key = sha1(key);
  const k = new Uint8Array(B);
  k.set(key);
  const ipad = k.map((x) => x ^ 0x36);
  const opad = k.map((x) => x ^ 0x5c);
  return sha1(concat(opad, sha1(concat(ipad, msg))));
}

function concat(a: Uint8Array, b: Uint8Array) {
  const r = new Uint8Array(a.length + b.length);
  r.set(a);
  r.set(b, a.length);
  return r;
}

function sha1(data: Uint8Array): Uint8Array {
  const ml = data.length * 8;
  const len = ((data.length + 9 + 63) >> 6) << 6;
  const buf = new Uint8Array(len);
  buf.set(data);
  buf[data.length] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(len - 4, ml >>> 0);
  dv.setUint32(len - 8, Math.floor(ml / 2 ** 32));
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
  const w = new Uint32Array(80);
  for (let o = 0; o < len; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 80; i++) {
      const x = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];
      w[i] = (x << 1) | (x >>> 31);
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let i = 0; i < 80; i++) {
      let f: number, k: number;
      if (i < 20) { f = (b & c) | (~b & d); k = 0x5a827999; }
      else if (i < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
      else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
      else { f = b ^ c ^ d; k = 0xca62c1d6; }
      const t = (((a << 5) | (a >>> 27)) + f + e + k + w[i]) >>> 0;
      e = d; d = c; c = (b << 30) | (b >>> 2); b = a; a = t;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
  }
  const out = new Uint8Array(20);
  const ov = new DataView(out.buffer);
  [h0, h1, h2, h3, h4].forEach((h, i) => ov.setUint32(i * 4, h));
  return out;
}
