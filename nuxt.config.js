
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

  /*
  ** Headers of the page
  ** See https://nuxtjs.org/api/configuration-head
  */
  head: {
    title: process.env.npm_package_name || '',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: process.env.npm_package_description || '' }
    ],
    link: [
      { rel: 'icon', type: 'image/png', href: '/logo.png' },
      { rel: 'shortcut icon', type: 'image/png', href: '/logo.png' },
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
      'GITHUB_CLIENT_SECRET',
      'GITHUB_APP_ACCESS_TOKEN'
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
      regular: ['faCopy', 'faCommentAlt'],
      solid: ['faCheck', 'faBan', 'faInfoCircle', 'faSignInAlt', 'faSignOutAlt', 'faAngleDoubleRight', 'faExternalLinkAlt', 'faCircleNotch'],
      brands: ['faEthereum', 'faTwitter', 'faGithub'],
    },
  },
}
