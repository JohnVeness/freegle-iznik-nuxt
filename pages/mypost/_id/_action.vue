<template>
  <b-container fluid>
    <b-row class="m-0">
      <b-col cols="12" lg="6" offset-lg="3" class="p-0">
        <div v-if="!message && !missing" class="text-center">
          <b-img-lazy src="~/static/loader.gif" alt="Loading" />
        </div>
        <div v-if="message">
          <GlobalWarning />
          <MyMessage
            v-if="message.fromuser && me && message.fromuser.id === me.id"
            :key="bump"
            :message="message"
            :show-old="true"
            :expand="true"
            :action="action"
          />
          <b-alert v-else variant="warning" class="mt-2" show>
            <h3>That post wasn't made from {{ me.email }}.</h3>
            <h5>{{ message.subject }}</h5>
            <p>
              Please change your email from
              <!-- eslint-disable-next-line-->
              <nuxt-link to="/settings">Settings</nuxt-link>
              if necessary - we'll merge your accounts.
            </p>
          </b-alert>
        </div>
        <div v-if="missing">
          <NoticeMessage variant="danger" class="mt-1">
            Sorry, we couldn't find that message.  Perhaps it's been deleted, or perhaps the link you clicked on is
            wrong?
          </NoticeMessage>
          <div class="text-center">
            <b-btn variant="primary" size="lg" class="mt-2" to="/myposts">
              Go to My Posts <v-icon name="angle-double-right" />
            </b-btn>
          </div>
        </div>
      </b-col>
    </b-row>
    <DonationAskModal ref="askmodal" :groupid="donationGroup" />
  </b-container>
</template>
<script>
import loginRequired from '@/mixins/loginRequired.js'
import buildHead from '@/mixins/buildHead.js'
import GlobalWarning from '../../../components/GlobalWarning'
import NoticeMessage from '../../../components/NoticeMessage'
const MyMessage = () => import('~/components/MyMessage.vue')
const DonationAskModal = () => import('~/components/DonationAskModal')

export default {
  components: {
    NoticeMessage,
    MyMessage,
    GlobalWarning,
    DonationAskModal
  },
  mixins: [loginRequired, buildHead],
  data() {
    return {
      donationGroup: null,
      contactGroup: null,
      missing: false,
      bump: Date.now()
    }
  },
  computed: {
    message() {
      return this.$store.getters['messages/get'](this.id)
    }
  },
  watch: {
    async me(newVal, oldVal) {
      if (newVal) {
        if (!oldVal) {
          // We have logged in. Fetch the message again because we won't have our details.
          await this.$store.dispatch('messages/fetch', {
            id: this.id
          })

          this.setGroup()

          // Force re-render of the message, which will trigger any action we have.
          this.bump = Date.now()
        }
      }
    }
  },
  beforeCreate() {
    this.id = this.$route.params.id
    this.action = this.$route.params.action
  },
  async mounted() {
    try {
      await this.$store.dispatch('messages/fetch', {
        id: this.id,
        force: true
      })

      const message = this.$store.getters['messages/get'](this.id)

      if (
        message &&
        message.fromuser &&
        this.me &&
        message.fromuser.id !== this.myid
      ) {
        // Message was from a different user.  Probably logged in as the wrong user.  Let the server know.
        this.$store.dispatch('auth/addRelatedUser', {
          id: message.fromuser.id
        })
      }

      this.bump = Date.now()

      // Fetch the chats.  We need this so that we can find chats with unread messages which relate to our own posts
      await this.$store.dispatch('chats/listChats')

      // For some reason we can't capture emitted events from the outcome modal so use root as a bus.
      this.$root.$on('outcome', params => {
        const { groupid, outcome } = params

        if (outcome === 'Taken' || outcome === 'Received') {
          this.donationGroup = groupid
          this.ask()
        }
      })

      // If they have an intended outcome, then we save that to the server now.  This means that if they never
      // get round to doing anything else on this page we'll assume that's what they wanted.  We do this because
      // we've seen people click the button in the email a lot and then bail out.
      if (this.action && this.me && this.myid === message.fromuser.id) {
        let outcome = null

        if (this.action === 'repost') {
          outcome = 'Repost'
        } else if (this.action === 'withdraw') {
          outcome = 'Withdrawn'
        } else if (this.action === 'completed') {
          outcome = this.message.type === 'Offer' ? 'Taken' : 'Received'
        }

        if (outcome) {
          this.$store.dispatch('messages/intend', {
            id: this.id,
            outcome: outcome
          })
        }
      }
    } catch (e) {
      // We couldn't fetch that message.  Probably deleted.
      this.missing = true
    }
  },
  methods: {
    ask(groupid) {
      this.waitForRef('askmodal', () => {
        this.$refs.askmodal.show()
      })
    },
    setGroup() {
      if (this.message && this.message.groups && this.message.groups.length) {
        this.contactGroup = this.message.groups[0].id
      }
    }
  },
  head() {
    return this.buildHead(
      'My Posts',
      "See OFFERs/WANTEDs that you've posted, and replies to them."
    )
  }
}
</script>
