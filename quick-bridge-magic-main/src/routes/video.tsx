import { createFileRoute } from '@tanstack/react-router'
import VideoTemplate from '@/components/video/VideoTemplate'

const PAGE_TITLE       = 'How QuickBridge Works 2026: Send Files Between Devices Fast'
const PAGE_DESCRIPTION = 'Watch how QuickBridge transfers files between devices in 2026. Open on both devices, scan the QR code, and send. No app, no sign-up, no cloud upload.'
const PAGE_URL         = 'https://quickbridge.app/video'
const THUMBNAIL_URL    = 'https://quickbridge.app/og-video.png'
const VIDEO_URL        = 'https://quickbridge.app/quickbridge-demo.webm'

const VIDEO_SCHEMA = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  thumbnailUrl: THUMBNAIL_URL,
  contentUrl: VIDEO_URL,
  embedUrl: PAGE_URL,
  uploadDate: '2026-06-03',
  dateModified: '2026-06-15',
  duration: 'PT1M20S',
  publisher: {
    '@type': 'Organization',
    name: 'QuickBridge',
    url: 'https://quickbridge.app',
    logo: {
      '@type': 'ImageObject',
      url: 'https://quickbridge.app/brand/quickbridge-logo.png',
    },
  },
})

export const Route = createFileRoute('/video')({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: 'description', content: PAGE_DESCRIPTION },
      { property: 'og:type', content: 'video.other' },
      { property: 'og:title', content: PAGE_TITLE },
      { property: 'og:description', content: PAGE_DESCRIPTION },
      { property: 'og:url', content: PAGE_URL },
      { property: 'og:image', content: THUMBNAIL_URL },
      { property: 'og:image:width', content: '1280' },
      { property: 'og:image:height', content: '720' },
      { property: 'og:video', content: VIDEO_URL },
      { property: 'og:video:type', content: 'video/webm' },
      { property: 'og:video:width', content: '1920' },
      { property: 'og:video:height', content: '1080' },
      { name: 'twitter:card', content: 'player' },
      { name: 'twitter:title', content: PAGE_TITLE },
      { name: 'twitter:description', content: PAGE_DESCRIPTION },
      { name: 'twitter:image', content: THUMBNAIL_URL },
      { name: 'twitter:player', content: PAGE_URL },
      { name: 'twitter:player:width', content: '1920' },
      { name: 'twitter:player:height', content: '1080' },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: VIDEO_SCHEMA,
      },
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://quickbridge.app/' },
            { '@type': 'ListItem', position: 2, name: 'Video', item: PAGE_URL },
          ],
        }),
      },
    ],
  }),
  component: VideoTemplate,
})
