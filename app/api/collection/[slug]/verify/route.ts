import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import { COLLECTION_WITH_PROJECTS_QUERY } from '@/sanity/lib/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { password } = body;

    if (!slug || !password) {
      return NextResponse.json(
        { success: false, error: 'Slug and password required' },
        { status: 400 }
      );
    }

    const collection = await client.fetch<{
      _id: string;
      title?: string;
      slug?: { current?: string };
      password?: string;
      projects?: Array<{
        _id: string;
        title?: string;
        workType?: string;
        year?: string;
        with?: string;
        link?: string;
        media?: Array<{
          mediaType: string;
          imageUrl?: string;
          hlsUrl?: string;
          fitMode?: string;
          useMobileAlternative?: boolean;
          mobileMediaType?: string;
          mobileImageUrl?: string;
          mobileHlsUrl?: string;
          mobileFitMode?: string;
        }>;
      }>;
    } | null>(COLLECTION_WITH_PROJECTS_QUERY, { slug });

    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Need to fetch password separately since it's not in the projection
    const fullCollection = await client.fetch<{ password?: string }>(
      `*[_type == "collection" && slug.current == $slug][0]{ password }`,
      { slug }
    );

    if (fullCollection?.password !== password) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: collection._id,
        title: collection.title,
        slug: collection.slug,
        projects: collection.projects ?? [],
      },
    });
  } catch (error) {
    console.error('Collection verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
