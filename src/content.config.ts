import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const guideSchema = z.object({
  title: z.string(),
  game: z.string(),
  category: z.enum(['guide', 'character', 'tier-list', 'event']),
  tags: z.array(z.string()).default([]),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  description: z.string(),
  featured: z.boolean().default(false),
  related: z.array(z.string()).default([]),
});

const siteSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

export const collections = {
  guides: defineCollection({
    loader: glob({ pattern: '**/*.mdx', base: './content/games/blaze-crown/guides' }),
    schema: guideSchema,
  }),
  site: defineCollection({
    loader: glob({ pattern: '**/*.mdx', base: './content/site' }),
    schema: siteSchema,
  }),
};
