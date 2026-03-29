/**
 * `src/content/legal` 폴더의 `.md` 파일을 자동으로 묶습니다.
 * 새 문서를 추가하면 파일명(확장자 제외)이 slug가 되며, 라우트/화면에서 `getLegalMarkdown(slug)`로 불러옵니다.
 */
const rawModules = import.meta.glob('./*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const slugToContent: Record<string, string> = {};
for (const path of Object.keys(rawModules)) {
  const slug = path.replace(/^\.\//, '').replace(/\.md$/, '');
  slugToContent[slug] = rawModules[path];
}

export function getLegalMarkdown(slug: string): string | undefined {
  return slugToContent[slug];
}

export const legalMarkdownSlugs = Object.freeze(Object.keys(slugToContent));
