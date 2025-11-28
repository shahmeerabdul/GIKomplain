import bcrypt from 'bcryptjs'
import { prisma } from './db'
import { verifyToken } from './jwt'

export * from './jwt'

export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
}

export async function getUserFromToken(token: string) {
    const payload = verifyToken(token)
    if (!payload) return null

    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, role: true, name: true, departmentId: true }
    })

    return user
}

