import { defineQuery } from 'next-sanity';

export const COLLECTION_PROJECTS_FOR_ABOUT_QUERY = defineQuery(`
  *[_type == "collection" && slug.current == $slug][0] {
    "projects": projects[]->{
      title,
      workType,
      year,
      "with": with,
      link,
      "firstImage": media[mediaType == "image"][0]{
        mediaType,
        "imageUrl": image.asset->url
      }
    }
  }
`);

export const COLLECTION_BY_SLUG_QUERY = defineQuery(`
  *[_type == "collection" && slug.current == $slug][0] {
    _id,
    title,
    slug
  }
`);

export const COLLECTION_WITH_PROJECTS_QUERY = defineQuery(`
  *[_type == "collection" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    "projects": projects[]->{
      _id,
      title,
      workType,
      year,
      "with": with,
      link,
      "media": media[]{
        mediaType,
        "imageUrl": image.asset->url,
        hlsUrl,
        fitMode,
        useMobileAlternative,
        mobileMediaType,
        "mobileImageUrl": mobileImage.asset->url,
        mobileHlsUrl,
        mobileFitMode
      }
    }
  }
`);
