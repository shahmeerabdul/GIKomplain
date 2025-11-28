import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-prod'

export interface TokenPayload {
    userId: string
    email: string
    role: string
    departmentId?: string | null
}

export function signToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' })
}

import { jwtVerify } from 'jose'

export async function verifyTokenEdge(token: string): Promise<TokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET))
        return payload as unknown as TokenPayload
    } catch (error) {
        return null
    }
}

export function verifyToken(token: string): TokenPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload
    } catch (error) {
        return null
    }
}
