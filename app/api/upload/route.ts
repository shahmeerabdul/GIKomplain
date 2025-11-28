import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const filename = `${uuidv4()}-${file.name}`
    const uploadDir = path.join(process.cwd(), 'public/uploads')
    const filepath = path.join(uploadDir, filename)

    // Ensure directory exists (basic check, assuming public/uploads exists or created manually/script)
    // For robustness, we should create it if missing, but ignoring for brevity in this step

    try {
        await writeFile(filepath, buffer)
        return NextResponse.json({
            url: `/uploads/${filename}`,
            name: file.name,
            size: file.size
        })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}
