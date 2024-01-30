const base64Encode = (str: string): string => 
  btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export const signJWT = async (payload: object, key: string): Promise<string> => {
  const encoder = new TextEncoder();

  const encodedHeader = base64Encode(JSON.stringify({
    alg: 'HS256',
    typ: 'JWT',
  }));
  const encodedPayload = base64Encode(JSON.stringify(payload));

  const keyData = encoder.encode(key);
  const messageData = encoder.encode(`${encodedHeader}.${encodedPayload}`);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  );

  const signatureArrayBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const signature = base64Encode(String.fromCharCode(...Array.from(new Uint8Array(signatureArrayBuffer))));

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};