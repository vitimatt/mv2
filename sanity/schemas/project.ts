import { defineField, defineType } from 'sanity';

export const mediaItemType = defineType({
  name: 'mediaItem',
  title: 'Media Item',
  type: 'object',
  fields: [
    defineField({
      name: 'mediaType',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Image', value: 'image' },
          { title: 'Video (HLS)', value: 'video' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      hidden: ({ parent }) => parent?.mediaType !== 'image',
    }),
    defineField({
      name: 'hlsUrl',
      title: 'HLS Playlist URL',
      type: 'url',
      description: 'URL to .m3u8 HLS playlist',
      hidden: ({ parent }) => parent?.mediaType !== 'video',
    }),
    defineField({
      name: 'fitMode',
      title: 'Display',
      type: 'string',
      options: {
        list: [
          { title: 'Fit', value: 'fit' },
          { title: 'Fill', value: 'fill' },
        ],
        layout: 'radio',
      },
      description:
        'Fit: vertical content fits inside 100vh viewport. Fill: content fills the width at its natural height (no cropping).',
      initialValue: 'fit',
    }),
    defineField({
      name: 'useMobileAlternative',
      title: 'Mobile alternative',
      type: 'boolean',
      description: 'Show different image/video on mobile devices',
      initialValue: false,
    }),
    defineField({
      name: 'mobileMediaType',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Image', value: 'image' },
          { title: 'Video (HLS)', value: 'video' },
        ],
        layout: 'radio',
      },
      hidden: ({ parent }) => !parent?.useMobileAlternative,
    }),
    defineField({
      name: 'mobileImage',
      title: 'Image',
      type: 'image',
      hidden: ({ parent }) => !parent?.useMobileAlternative || parent?.mobileMediaType !== 'image',
    }),
    defineField({
      name: 'mobileHlsUrl',
      title: 'HLS Playlist URL',
      type: 'url',
      description: 'URL to .m3u8 HLS playlist',
      hidden: ({ parent }) => !parent?.useMobileAlternative || parent?.mobileMediaType !== 'video',
    }),
    defineField({
      name: 'mobileFitMode',
      title: 'Display',
      type: 'string',
      options: {
        list: [
          { title: 'Fit', value: 'fit' },
          { title: 'Fill', value: 'fill' },
        ],
        layout: 'radio',
      },
      description:
        'Fit: vertical content fits inside 100vh viewport. Fill: content fills the width at its natural height (no cropping).',
      initialValue: 'fit',
      hidden: ({ parent }) => !parent?.useMobileAlternative,
    }),
  ],
  preview: {
    select: {
      mediaType: 'mediaType',
      image: 'image',
    },
    prepare({ mediaType, image }) {
      return {
        title: mediaType === 'image' ? 'Image' : 'Video (HLS)',
        media: image,
      };
    },
  },
});

export const projectType = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'workType',
      title: 'Work type',
      type: 'string',
      description: 'e.g. Website, Design, Art Direction',
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'string',
      description: 'e.g. 2023 or 2023-2024',
    }),
    defineField({
      name: 'with',
      title: 'With',
      type: 'string',
      description: 'Collaborators or partners, e.g. w/Neue',
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: 'url',
      description: 'URL to the project or external site',
    }),
    defineField({
      name: 'media',
      title: 'Media',
      type: 'array',
      of: [{ type: 'mediaItem' }],
      description: 'Drag to reorder images and videos',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      workType: 'workType',
      year: 'year',
    },
    prepare({ title, workType, year }) {
      const subtitle = [workType, year].filter(Boolean).join(' · ');
      return {
        title: title ?? 'Untitled Project',
        subtitle: subtitle || undefined,
      };
    },
  },
});
