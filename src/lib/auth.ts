import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey123';

export interface UserPayload {
  id: string;
  username: string;
  role: string;
  nm_kelurahan?: string | null;
  nm_kecamatan?: string | null;
}

export function signToken(payload: UserPayload): string {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '1d' });
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, SECRET_KEY) as UserPayload;
  } catch (error) {
    return null;
  }
}
