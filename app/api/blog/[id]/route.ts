import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/blog/[id] - Get single blog post
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        categories: true,
        tags: true,
        analytics: {
          orderBy: { date: 'desc' },
          take: 30 // Last 30 days of analytics
        }
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await prisma.blogPost.update({
      where: { id },
      data: { views: { increment: 1 } }
    })

    // Record analytics
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find existing analytics record for today
    const existingAnalytics = await prisma.blogAnalytics.findFirst({
      where: {
        postId: id,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    })

    if (existingAnalytics) {
      await prisma.blogAnalytics.update({
        where: { id: existingAnalytics.id },
        data: {
          views: { increment: 1 },
          uniqueViews: { increment: 1 }
        }
      })
    } else {
      await prisma.blogAnalytics.create({
        data: {
          postId: id,
          date: today,
          views: 1,
          uniqueViews: 1
        }
      })
    }

    return NextResponse.json(post)

  } catch (error) {
    console.error('Blog Post API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    )
  }
}

// PUT /api/blog/[id] - Update blog post
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()

    // Check if user owns the post or is admin
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
      select: { authorId: true }
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })

    if (existingPost.authorId !== session.user.id && !user?.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { 
      title, 
      content, 
      excerpt, 
      featuredImage,
      status,
      scheduledFor,
      metaTitle,
      metaDescription,
      keywords,
      categories,
      tags
    } = body

    // Update slug if title changed
    const slug = title ? title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') : undefined

    // Calculate reading time if content changed
    const readingTime = content ? Math.ceil(content.split(/\s+/).length / 200) : undefined

    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title
    if (slug !== undefined) updateData.slug = slug
    if (content !== undefined) updateData.content = content
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage
    if (status !== undefined) {
      updateData.status = status
      if (status === 'published' && !existingPost) {
        updateData.publishedAt = new Date()
      }
    }
    if (scheduledFor !== undefined) updateData.scheduledFor = scheduledFor ? new Date(scheduledFor) : null
    if (readingTime !== undefined) updateData.readingTime = readingTime
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription
    if (keywords !== undefined) updateData.keywords = keywords

    if (categories || tags) {
      if (categories) {
        updateData.categories = {
          set: categories.map((id: string) => ({ id }))
        }
      }
      if (tags) {
        updateData.tags = {
          set: tags.map((id: string) => ({ id }))
        }
      }
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        categories: true,
        tags: true
      }
    })

    return NextResponse.json(post)

  } catch (error) {
    console.error('Blog Update Error:', error)
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    )
  }
}

// DELETE /api/blog/[id] - Delete blog post
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Check if user owns the post or is admin
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
      select: { authorId: true }
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })

    if (existingPost.authorId !== session.user.id && !user?.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    await prisma.blogPost.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Blog Delete Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    )
  }
}