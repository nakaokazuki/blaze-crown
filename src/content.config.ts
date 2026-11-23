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
  /** false のとき本文ヘッダーに description を出さない（meta 用にだけ残す） */
  showLead: z.boolean().default(true),
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
  /** ローカル・下書きプレビュー用（/drafts/・noindex・サイトマップ除外） */
  draftGuides: defineCollection({
    loader: glob({ pattern: '**/*.mdx', base: './content/drafts/guides' }),
    schema: guideSchema,
  }),
  site: defineCollection({
    loader: glob({ pattern: '**/*.mdx', base: './content/site' }),
    schema: siteSchema,
  }),
};
