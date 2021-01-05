const fs = require("fs")

export default {
  /*
  ** Nuxt rendering mode
  ** See https://nuxtjs.org/api/configuration-mode
  */
  mode: 'spa',
  /*
  ** Nuxt target
  ** See https://nuxtjs.org/api/configuration-target
  */
  target: 'server',

  /*
  ** API
  */
  serverMiddleware: ["~/api/index"],

  env: {
    OCTOBAY_ABI: JSON.parse(fs.readFileSync("./build/contracts/OctoBay.json").toString()).abi,
    LINK_TOKEN_ABI: JSON.parse(fs.readFileSync("./build/contracts/LinkToken.json").toString()).abi,
    ORACLES: JSON.parse(fs.readFileSync("./oracles.json").toString())
  },

  /*
  ** Headers of the page
  ** See https://nuxtjs.org/api/configuration-head
  */
  head: {
    title: 'OctoBay',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: process.env.npm_package_description || '' },
      { property: 'og:title', content: 'OctoBay' },
      { property: 'og:image', content: 'https://octobay.uber.space/cover.png' },
      { property: 'twitter:title', content: 'OctoBay' },
      { property: 'twitter:image', content: 'https://octobay.uber.space/cover.png' },
    ],
    link: [
      { rel: 'icon', type: 'image/png', href: '/icon.png' },
      { rel: 'shortcut icon', type: 'image/png', href: '/icon.png' },
    ],
  },
  /*
  ** Global CSS
  */
  css: [
    '@/assets/css/main.sass'
  ],
  /*
  ** Plugins to load before mounting the App
  ** https://nuxtjs.org/guide/plugins
  */
  plugins: [
    '@/plugins/moment',
    '@/plugins/tooltips',
    '@/plugins/web3',
    '@/plugins/load',
    '@/plugins/clipboard',
  ],
  /*
  ** Auto import components
  ** See https://nuxtjs.org/api/configuration-components
  */
  components: true,
  /*
  ** Nuxt.js dev-modules
  */
  buildModules: [
    ['@nuxtjs/dotenv', { only: [
      'API_URL',
      'GITHUB_CLIENT_ID',
      'OCTOBAY_ADDRESS',
      'CHAINLINK_NODE_ADDRESS',
      'LINK_TOKEN_ADDRESS',
      'MAX_CLAIMPR_AGE'
    ] }],
    '@nuxtjs/fontawesome',
  ],
  /*
  ** Nuxt.js modules
  */
  modules: [
    '@nuxtjs/axios',
    '@nuxtjs/pwa',
  ],
  /*
  ** Build configuration
  ** See https://nuxtjs.org/api/configuration-build/
  */
  build: {},

  fontawesome: {
    icons: {
      regular: [
        'faCopy',
        'faCommentAlt',
        'faFlag',
        'faFrown',
        'faSmile',
        'faCalendarAlt'
      ],
      solid: [
        'faPlus',
        'faMinus',
        'faChevronUp',
        'faChevronDown',
        'faLongArrowAltUp',
        'faCheck',
        'faBan',
        'faInfoCircle',
        'faExclamationTriangle',
        'faSignInAlt',
        'faSignOutAlt',
        'faAngleDoubleRight',
        'faExternalLinkAlt',
        'faCircleNotch',
        'faCircle',
        'faThumbtack',
        'faCoins',
        'faExclamationCircle',
        'faCodeBranch',
        'faFaucet',
        'faEnvelope',
        'faGlobeAmericas',
        'faGavel',
        'faUser',
        'faCode',
        'faTimes',
        'faStar',
        'faUsers'
      ],
      brands: ['faEthereum', 'faTwitter', 'faGithub', 'faDiscord'],
    },
  },
}
