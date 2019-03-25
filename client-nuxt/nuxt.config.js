const pkg = require('./package')

module.exports = {
  mode: 'universal',

  /*
  ** Headers of the page
  */
  head: {
    title: pkg.name,
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: pkg.description }
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
  },

  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#61AE24' },

  /*
  ** Global CSS
  */
  css: [],

  /*
  ** Plugins to load before mounting the App
  */
  plugins: [
    // Bootstrap for styling.
    '~/plugins/bootstrap',

    // Persisting to storage is a client-side feature.
    { src: '~/plugins/vuex-persistedstate', ssr: false },
    { src: '~plugins/vue-drag-drop.js', ssr: false },
    { src:'~/plugins/vue-color', ssr: false }
  ],

  /*
  ** Nuxt.js modules
  */
  modules: [
    'nuxt-rfg-icon',

    '@nuxtjs/axios',

    '@nuxtjs/pwa',
    [
      'nuxt-i18n',
      {
        locales: [
          {
            code: 'en',
            iso: 'en-GB'
          }
        ],
        defaultLocale: 'en',
        vueI18n: {
          fallbackLocale: 'en',
          messages: {
            en: {
            }
          }
        }
      }
    ],

    [
      'nuxt-fontawesome',
      {
        component: 'fa',
        imports: [
          // import whole set
          {
            set: '@fortawesome/free-solid-svg-icons',
            icons: ['fas']
          }
        ]
      }
    ]
  ],

  /*
  ** Axios module configuration
  */
  axios: {
  },

  /*
  ** Build configuration
  */
  build: {
    /*
    ** You can extend webpack config here
    */
    extend(config, ctx) {
      // Run ESLint on save
      if (ctx.isDev && ctx.isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/,
          options: {
            fix: true
          }
        })
      }
    }
  },

  env: {
    API: process.env.IZNIK_API || 'https://dev.ilovefreegle.org/api'
  },

  // We have some configuration to ensure that we handle both SSR and being logged in.
  serverMiddleware: ['~/serverMiddleware'],

  forceSPAOn: ['/login']
}
