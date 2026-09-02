const MARKDOWN_IMAGE_RE = /!\[[^\]]*\]\([^)]*\)/g
const INCOMPLETE_MARKDOWN_IMAGE_RE = /!\[(?:[^\]]*(?:\]\([^)]*)?)?\s*$/
const EXTRA_BLANK_LINES_RE = /\n{3,}/g

export function stripMarkdownImages(text: string): string {
  const withoutImages = text
    .replace(MARKDOWN_IMAGE_RE, '')
    .replace(INCOMPLETE_MARKDOWN_IMAGE_RE, '')
    .replace(EXTRA_BLANK_LINES_RE, '\n\n')
  return withoutImages.trim() ? withoutImages : ''
}
