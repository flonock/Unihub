import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Aerospace Workspace',
    short_name: 'Workspace',
    description: 'Productivity workspace for university studies',
    start_url: '/',
    display: 'standalone',
    background_color: '#191724',
    theme_color: '#191724',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
