import { Role } from '../lib/enums'
import { prisma } from '../lib/db'
import bcrypt from 'bcryptjs'

async function main() {
    console.log('Starting seed...')

    // Create Departments
    const departments = ['Computer Science', 'Electrical Engineering', 'Administration', 'Student Affairs', 'Maintenance']

    for (const dept of departments) {
        await prisma.department.upsert({
            where: { name: dept },
            update: {},
            create: { name: dept },
        })
    }
    console.log('Departments seeded.')

    // Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10)
    await prisma.user.upsert({
        where: { email: 'admin@giki.edu.pk' },
        update: {},
        create: {
            email: 'admin@giki.edu.pk',
            name: 'System Administrator',
            password: adminPassword,
            role: Role.ADMIN,
        },
    })
    console.log('Admin user seeded.')

    console.log('Seeding completed.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
