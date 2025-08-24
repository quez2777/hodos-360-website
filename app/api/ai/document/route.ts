import { NextRequest, NextResponse } from 'next/server'
import { documentProcessor } from '@/lib/ai/document-processor'
import { AIError } from '@/lib/ai/openai-client'
import { z } from 'zod'

// Request validation schemas
const processRequestSchema = z.object({
  extractEntities: z.boolean().optional(),
  analyzeRisks: z.boolean().optional(),
  identifyClauses: z.boolean().optional(),
  generateSummary: z.boolean().optional(),
  maxPages: z.number().min(1).max(500).optional(),
  language: z.string().optional(),
})

const compareRequestSchema = z.object({
  // Files will be in FormData
})

const generateRequestSchema = z.object({
  templateType: z.enum(['contract', 'nda', 'lease', 'brief']),
  parameters: z.record(z.any()),
})

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders })
}

// Main document processing endpoint
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const optionsStr = formData.get('options') as string

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided',
        },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unsupported file type. Please upload PDF, TXT, or DOCX files.',
        },
        { status: 400, headers: corsHeaders }
      )
    }

    // Parse and validate options
    let options = {}
    if (optionsStr) {
      try {
        const parsed = JSON.parse(optionsStr)
        options = processRequestSchema.parse(parsed)
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid processing options',
          },
          { status: 400, headers: corsHeaders }
        )
      }
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Process document
    const analysis = await documentProcessor.processDocument(
      buffer,
      file.name,
      options
    )

    return NextResponse.json(
      {
        success: true,
        data: analysis,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Document processing error:', error)

    if (error instanceof AIError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: error.statusCode, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process document',
      },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Document comparison endpoint
export async function POST_compare(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file1 = formData.get('file1') as File
    const file2 = formData.get('file2') as File

    if (!file1 || !file2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide two files to compare',
        },
        { status: 400, headers: corsHeaders }
      )
    }

    // Convert files to buffers
    const [buffer1, buffer2] = await Promise.all([
      Buffer.from(await file1.arrayBuffer()),
      Buffer.from(await file2.arrayBuffer()),
    ])

    // Compare documents
    const comparison = await documentProcessor.compareDocuments(
      buffer1,
      file1.name,
      buffer2,
      file2.name
    )

    return NextResponse.json(
      {
        success: true,
        data: comparison,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Document comparison error:', error)

    if (error instanceof AIError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to compare documents',
      },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Document generation endpoint
export async function POST_generate(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = generateRequestSchema.parse(body)

    const { templateType, parameters } = validatedData

    // Generate document
    const result = await documentProcessor.generateDocumentFromTemplate(
      templateType,
      parameters
    )

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Document generation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400, headers: corsHeaders }
      )
    }

    if (error instanceof AIError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate document',
      },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Quick document summary endpoint
export async function POST_summary(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided',
        },
        { status: 400, headers: corsHeaders }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Process with summary only
    const analysis = await documentProcessor.processDocument(
      buffer,
      file.name,
      {
        extractEntities: false,
        analyzeRisks: false,
        identifyClauses: false,
        generateSummary: true,
      }
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          summary: analysis.summary,
          documentType: analysis.documentType,
          metadata: {
            pageCount: analysis.metadata.pageCount,
            wordCount: analysis.metadata.wordCount,
          },
        },
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Document summary error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate summary',
      },
      { status: 500, headers: corsHeaders }
    )
  }
}