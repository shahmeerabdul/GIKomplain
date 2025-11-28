import { NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
        return NextResponse.json({ user: null }, { status: 401 })
    }

    const user = await getUserFromToken(token)

    if (!user) {
        return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user })
}
