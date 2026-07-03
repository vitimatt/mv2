import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import { COLLECTION_WITH_PROJECTS_QUERY } from '@/sanity/lib/queries';
import {
  createCollectionAccessToken,
  getCollectionAccessCookieName,
  getCollectionAccessCookieOptions,
  verifyCollectionAccessToken,
} from '@/lib/collection-auth';

type CollectionRecord = {
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
};

function buildCollectionResponse(collection: CollectionRecord) {
  return {
    _id: collection._id,
    title: collection.title,
    slug: collection.slug,
    projects: collection.projects ?? [],
  };
}

async function fetchCollection(slug: string) {
  const collection = await client.fetch<CollectionRecord | null>(
    COLLECTION_WITH_PROJECTS_QUERY,
    { slug }
  );

  if (!collection) return null;

  const { password } = await client.fetch<{ password?: string }>(
    `*[_type == "collection" && slug.current == $slug][0]{ password }`,
    { slug }
  );

  return { ...collection, password };
}

function unauthorized() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const token = request.cookies.get(getCollectionAccessCookieName(slug))?.value;

    if (!slug || !token) {
      return unauthorized();
    }

    const collection = await fetchCollection(slug);
    if (!collection?.password) {
      return unauthorized();
    }

    if (
      !verifyCollectionAccessToken(
        slug,
        collection._id,
        collection.password,
        token
      )
    ) {
      return unauthorized();
    }

    return NextResponse.json({
      success: true,
      data: buildCollectionResponse(collection),
    });
  } catch (error) {
    console.error('Collection access check error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

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

    const collection = await fetchCollection(slug);

    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }

    if (collection.password !== password) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: buildCollectionResponse(collection),
    });

    response.cookies.set(
      getCollectionAccessCookieName(slug),
      createCollectionAccessToken(slug, collection._id, collection.password),
      getCollectionAccessCookieOptions()
    );

    return response;
  } catch (error) {
    console.error('Collection verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
