import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'SocialFlow',
  description: 'Professional Social Media Management & Web3 Promoting Platform',
  base: '/',
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'API', link: '/api/overview' },
      { text: 'Examples', link: '/examples/getting-started' },
      {
        text: 'v1.0.0',
        items: [
          { text: 'v1.0.0', link: '/versions/v1' },
          { text: 'Changelog', link: '/versions/changelog' }
        ]
      }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is SocialFlow?', link: '/guide/introduction' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Installation', link: '/guide/installation' }
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Architecture', link: '/guide/architecture' },
            { text: 'AI Integration', link: '/guide/ai-integration' },
            { text: 'Stellar Network', link: '/guide/stellar-network' },
            { text: 'Smart Contracts', link: '/guide/smart-contracts' }
          ]
        },
        {
          text: 'Features',
          items: [
            { text: 'Content Management', link: '/guide/content-management' },
            { text: 'Wallet Integration', link: '/guide/wallet-integration' },
            { text: 'Asset Minting', link: '/guide/asset-minting' },
            { text: 'NFT Creation', link: '/guide/nft-creation' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/overview' },
            { text: 'Gemini Service', link: '/api/gemini-service' },
            { text: 'Stellar Service', link: '/api/stellar-service' },
            { text: 'Transaction Queue', link: '/api/transaction-queue' }
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Getting Started', link: '/examples/getting-started' },
            { text: 'AI Content Generation', link: '/examples/ai-content' },
            { text: 'Token Minting', link: '/examples/token-minting' },
            { text: 'NFT Deployment', link: '/examples/nft-deployment' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/hman38705/socialflow-ai-dashboard' }
    ],
    search: {
      provider: 'local'
    },
    footer: {
      message: 'Built with ❤️ by SocialFlow Labs & The Stellar Global Community',
      copyright: 'Copyright © 2024 SocialFlow'
    }
  }
})
