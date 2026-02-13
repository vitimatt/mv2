import { notFound } from 'next/navigation';
import { client } from '@/sanity/lib/client';
import { COLLECTION_BY_SLUG_QUERY } from '@/sanity/lib/queries';
import { CollectionViewer } from './CollectionViewer';

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const collection = await client.fetch<{
    _id: string;
    title?: string;
    slug?: { current?: string };
  } | null>(COLLECTION_BY_SLUG_QUERY, { slug });

  if (!collection) {
    notFound();
  }

  return (
    <CollectionViewer
      slug={slug}
      title={collection.title ?? 'Collection'}
    />
  );
}
