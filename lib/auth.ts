import crypto from "crypto";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");

  const hash = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");

  return `${salt}:${hash}`;
}

export function verifyPassword(
  password: string,
  storedPassword: string
): boolean {
  const [salt, storedHash] =
    storedPassword.split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const hash = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");

  const storedBuffer = Buffer.from(
    storedHash,
    "hex"
  );

  const hashBuffer = Buffer.from(
    hash,
    "hex"
  );

  if (
    storedBuffer.length !==
    hashBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    storedBuffer,
    hashBuffer
  );
}

export function createResetToken(): string {
  return crypto
    .randomBytes(32)
    .toString("hex");
}

export function hashResetToken(
  token: string
): string {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}