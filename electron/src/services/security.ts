import { generateSecret, verifySync, generateURI } from 'otplib';

export class SecurityService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly SALT = 'aura_persistent_salt_v1'; // In production, this should be unique per user
  private static readonly ITERATIONS = 100000;

  static async deriveKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordKey = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(this.SALT),
        iterations: this.ITERATIONS,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static async encrypt(data: string, key: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = encoder.encode(data);

    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: this.ALGORITHM, iv },
      key,
      encodedData
    );

    // Combine IV and encrypted content
    const combined = new Uint8Array(iv.length + encryptedContent.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedContent), iv.length);

    // Return as base64
    return btoa(String.fromCharCode(...combined));
  }

  static async decrypt(encryptedBase64: string, key: CryptoKey): Promise<string> {
    const decoder = new TextDecoder();
    const combined = new Uint8Array(
      atob(encryptedBase64)
        .split('')
        .map((c) => c.charCodeAt(0))
    );

    const iv = combined.slice(0, 12);
    const content = combined.slice(12);

    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: this.ALGORITHM, iv },
      key,
      content
    );

    return decoder.decode(decryptedContent);
  }

  static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + this.SALT);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static generateTOTPSecret(): string {
    return generateSecret();
  }

  static verifyTOTP(token: string, secret: string): boolean {
    return verifySync({ token, secret }).valid;
  }

  static getQRCodeUrl(user: string, secret: string): string {
    return generateURI({ label: user, issuer: 'AuraPersonalOS', secret });
  }
}
