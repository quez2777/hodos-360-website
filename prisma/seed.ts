import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import * as crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  console.log('👤 Creating admin user...')
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hodos360.com'
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'HODOS Admin',
      isAdmin: true,
    },
  })
  console.log(`✅ Admin user created: ${adminUser.email}`)

  // Create demo user for testing
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      isAdmin: false,
    },
  })
  console.log(`✅ Demo user created: ${demoUser.email}`)

  // Create sample clients
  console.log('👥 Creating sample clients...')
  const client1 = await prisma.client.create({
    data: {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@lawfirm.com',
      phone: '+1-555-0101',
      company: 'Smith & Associates LLC',
      address: '123 Legal Plaza, Suite 400, New York, NY 10001',
      status: 'active',
      userId: demoUser.id,
    },
  })

  const client2 = await prisma.client.create({
    data: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1-555-0102',
      company: 'Johnson Enterprises',
      address: '456 Business Ave, Los Angeles, CA 90210',
      status: 'active',
      userId: demoUser.id,
    },
  })

  const client3 = await prisma.client.create({
    data: {
      firstName: 'Michael',
      lastName: 'Brown',
      email: 'michael.brown@tech.com',
      phone: '+1-555-0103',
      company: 'Brown Tech Solutions',
      address: '789 Innovation Dr, Austin, TX 73301',
      status: 'inactive',
      userId: demoUser.id,
    },
  })

  console.log(`✅ Created ${[client1, client2, client3].length} sample clients`)

  // Create sample cases
  console.log('📋 Creating sample cases...')
  const case1 = await prisma.case.create({
    data: {
      title: 'Contract Dispute Resolution',
      description: 'Resolving a commercial contract dispute involving breach of terms and payment delays.',
      caseType: 'commercial',
      status: 'open',
      priority: 'high',
      startDate: new Date('2024-01-15'),
      userId: demoUser.id,
      clientId: client1.id,
    },
  })

  const case2 = await prisma.case.create({
    data: {
      title: 'Employment Agreement Review',
      description: 'Comprehensive review and negotiation of executive employment agreement.',
      caseType: 'employment',
      status: 'pending',
      priority: 'medium',
      startDate: new Date('2024-02-01'),
      userId: demoUser.id,
      clientId: client2.id,
    },
  })

  const case3 = await prisma.case.create({
    data: {
      title: 'Intellectual Property Registration',
      description: 'Filing trademark and patent applications for new software products.',
      caseType: 'intellectual-property',
      status: 'open',
      priority: 'high',
      startDate: new Date('2024-01-10'),
      userId: demoUser.id,
      clientId: client3.id,
    },
  })

  const case4 = await prisma.case.create({
    data: {
      title: 'Corporate Restructuring',
      description: 'Legal support for company restructuring and merger activities.',
      caseType: 'corporate',
      status: 'closed',
      priority: 'urgent',
      startDate: new Date('2023-11-15'),
      endDate: new Date('2024-01-31'),
      userId: demoUser.id,
      clientId: client1.id,
    },
  })

  console.log(`✅ Created ${[case1, case2, case3, case4].length} sample cases`)

  // Create sample documents
  console.log('📄 Creating sample documents...')
  const documents = []

  // Document for case 1
  documents.push(await prisma.document.create({
    data: {
      filename: `${Date.now()}_contract_001.pdf`,
      originalName: 'Original_Contract_Agreement.pdf',
      fileSize: 2048576, // 2MB
      mimeType: 'application/pdf',
      fileHash: crypto.randomBytes(32).toString('hex'),
      filePath: `/uploads/documents/${demoUser.id}/contract_001.pdf`,
      category: 'contract',
      description: 'Original contract agreement with dispute terms',
      isConfidential: true,
      userId: demoUser.id,
      caseId: case1.id,
    },
  }))

  // Document for case 2
  documents.push(await prisma.document.create({
    data: {
      filename: `${Date.now()}_employment_draft.docx`,
      originalName: 'Executive_Employment_Agreement_Draft.docx',
      fileSize: 1536000, // 1.5MB
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileHash: crypto.randomBytes(32).toString('hex'),
      filePath: `/uploads/documents/${demoUser.id}/employment_draft.docx`,
      category: 'legal',
      description: 'Draft executive employment agreement for review',
      isConfidential: true,
      userId: demoUser.id,
      caseId: case2.id,
    },
  }))

  // Document for case 3
  documents.push(await prisma.document.create({
    data: {
      filename: `${Date.now()}_patent_application.pdf`,
      originalName: 'Patent_Application_Form.pdf',
      fileSize: 3072000, // 3MB
      mimeType: 'application/pdf',
      fileHash: crypto.randomBytes(32).toString('hex'),
      filePath: `/uploads/documents/${demoUser.id}/patent_application.pdf`,
      category: 'legal',
      description: 'Patent application for new software algorithm',
      isConfidential: true,
      userId: demoUser.id,
      caseId: case3.id,
    },
  }))

  // General documents (not case-specific)
  documents.push(await prisma.document.create({
    data: {
      filename: `${Date.now()}_retainer_agreement.pdf`,
      originalName: 'Retainer_Agreement_Template.pdf',
      fileSize: 1024000, // 1MB
      mimeType: 'application/pdf',
      fileHash: crypto.randomBytes(32).toString('hex'),
      filePath: `/uploads/documents/${demoUser.id}/retainer_agreement.pdf`,
      category: 'general',
      description: 'Standard retainer agreement template',
      isConfidential: false,
      userId: demoUser.id,
      caseId: null,
    },
  }))

  console.log(`✅ Created ${documents.length} sample documents`)

  // Create sample marketing campaigns
  console.log('📈 Creating sample marketing campaigns...')
  const campaigns = []

  campaigns.push(await prisma.marketingCampaign.create({
    data: {
      name: 'Legal Tech SEO Campaign',
      description: 'SEO optimization for legal technology keywords',
      type: 'seo',
      status: 'active',
      budget: 5000.00,
      spent: 1250.50,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-30'),
      targetAudience: 'Law firms looking for AI solutions',
      goals: {
        impressions: 100000,
        clicks: 2500,
        conversions: 50,
        roi: 300
      },
      metrics: {
        currentImpressions: 45000,
        currentClicks: 1120,
        currentConversions: 23,
        currentRoi: 245
      },
      userId: demoUser.id,
    },
  }))

  campaigns.push(await prisma.marketingCampaign.create({
    data: {
      name: 'PPC Legal Services',
      description: 'Google Ads campaign for legal case management',
      type: 'ppc',
      status: 'active',
      budget: 10000.00,
      spent: 3200.75,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-05-31'),
      targetAudience: 'Solo practitioners and small law firms',
      goals: {
        impressions: 200000,
        clicks: 5000,
        conversions: 100,
        roi: 250
      },
      metrics: {
        currentImpressions: 87500,
        currentClicks: 2140,
        currentConversions: 48,
        currentRoi: 180
      },
      userId: demoUser.id,
    },
  }))

  campaigns.push(await prisma.marketingCampaign.create({
    data: {
      name: 'Email Newsletter Q1',
      description: 'Quarterly email newsletter about legal AI trends',
      type: 'email',
      status: 'completed',
      budget: 2000.00,
      spent: 1850.25,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-03-31'),
      targetAudience: 'Existing clients and prospects',
      goals: {
        opens: 5000,
        clicks: 500,
        conversions: 25,
        unsubscribes: 50
      },
      metrics: {
        opens: 5240,
        clicks: 567,
        conversions: 31,
        unsubscribes: 23
      },
      userId: demoUser.id,
    },
  }))

  console.log(`✅ Created ${campaigns.length} sample marketing campaigns`)

  // Create sample audit logs
  console.log('📝 Creating sample audit logs...')
  const auditLogs = []

  auditLogs.push(await prisma.auditLog.create({
    data: {
      action: 'CLIENT_CREATED',
      userId: demoUser.id,
      timestamp: new Date('2024-01-10T10:30:00Z'),
    },
  }))

  auditLogs.push(await prisma.auditLog.create({
    data: {
      action: 'CASE_CREATED',
      userId: demoUser.id,
      timestamp: new Date('2024-01-15T14:15:00Z'),
    },
  }))

  auditLogs.push(await prisma.auditLog.create({
    data: {
      action: 'DOCUMENT_UPLOADED',
      userId: demoUser.id,
      documentId: documents[0].id,
      filename: documents[0].originalName,
      fileHash: documents[0].fileHash,
      timestamp: new Date('2024-01-16T09:45:00Z'),
    },
  }))

  auditLogs.push(await prisma.auditLog.create({
    data: {
      action: 'DOCUMENT_UPLOADED',
      userId: demoUser.id,
      documentId: documents[1].id,
      filename: documents[1].originalName,
      fileHash: documents[1].fileHash,
      timestamp: new Date('2024-02-02T16:20:00Z'),
    },
  }))

  console.log(`✅ Created ${auditLogs.length} sample audit log entries`)

  // Create sample demo bookings
  console.log('📅 Creating sample demo bookings...')
  const demoBookings = []

  demoBookings.push(await prisma.demoBooking.create({
    data: {
      email: 'john.doe@lawfirm.com',
      name: 'John Doe',
      company: 'Doe & Associates',
      phone: '+1-555-2001',
      specialRequests: 'Interested in AI document analysis features',
      scheduledDate: new Date('2024-03-15T14:00:00Z'),
      scheduledTime: '14:00',
      status: 'confirmed',
      meetingLink: 'https://meet.hodos360.com/demo-john-doe',
      calendarLink: 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=HODOS+360+Demo',
      demoType: 'video-call',
      duration: '30 minutes',
    },
  }))

  demoBookings.push(await prisma.demoBooking.create({
    data: {
      email: 'sarah.wilson@legal.com',
      name: 'Sarah Wilson',
      company: 'Wilson Legal Group',
      phone: '+1-555-2002',
      specialRequests: 'Focus on marketing automation and SEO tools',
      scheduledDate: new Date('2024-03-18T15:30:00Z'),
      scheduledTime: '15:30',
      status: 'scheduled',
      meetingLink: 'https://meet.hodos360.com/demo-sarah-wilson',
      calendarLink: 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=HODOS+360+Demo',
      demoType: 'video-call',
      duration: '45 minutes',
    },
  }))

  demoBookings.push(await prisma.demoBooking.create({
    data: {
      email: 'mike.taylor@corporate.com',
      name: 'Mike Taylor',
      company: 'Corporate Legal Services',
      phone: '+1-555-2003',
      specialRequests: 'Need case management for large corporate cases',
      scheduledDate: new Date('2024-03-20T10:00:00Z'),
      scheduledTime: '10:00',
      status: 'completed',
      meetingLink: 'https://meet.hodos360.com/demo-mike-taylor',
      calendarLink: 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=HODOS+360+Demo',
      demoType: 'video-call',
      duration: '60 minutes',
      notes: 'Very interested in enterprise features. Follow up scheduled.',
    },
  }))

  console.log(`✅ Created ${demoBookings.length} sample demo bookings`)

  // Summary
  console.log('\n🎉 Database seeded successfully!')
  console.log('📊 Summary:')
  console.log(`   • ${2} users (1 admin, 1 demo)`)
  console.log(`   • ${3} clients`)
  console.log(`   • ${4} cases`)
  console.log(`   • ${4} documents`)
  console.log(`   • ${3} marketing campaigns`)
  console.log(`   • ${3} demo bookings`)
  console.log(`   • ${4} audit log entries`)
  console.log('\n🔐 Login credentials:')
  console.log(`   Admin: ${adminUser.email}`)
  console.log(`   Demo:  ${demoUser.email}`)
  console.log('\n💡 You can now test all APIs with real data!')
  console.log('\n🚀 Next steps:')
  console.log('   • Run `npm run test:apis` to test all endpoints')
  console.log('   • Start the development server with `npm run dev`')
  console.log('   • Access the application at http://localhost:3000')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })