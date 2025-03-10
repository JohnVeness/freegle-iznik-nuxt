<template>
  <div>
    <NoticeMessage v-if="invalid.length" variant="danger">
      <div v-if="summary">
        <v-icon name="exclamation-triangle" /> {{ invalid.length }} Twitter {{ invalid.length | pluralize(['account has', 'accounts have']) }} become unlinked.
        <b-btn variant="white" @click="expand">
          Click to view
        </b-btn>
      </div>
      <div v-else>
        <div v-for="(inv) of invalid" :key="'twinvalid-' + inv.group.id">
          <p>
            Twitter account <a :href="'https://twitter.com/' + inv.account.name" target="_blank" rel="noopener nofollower">{{ inv.account.name }}</a>
            for group
            <strong>{{ inv.group.namedisplay }}</strong>
            <span v-if="inv.account.locked">
              is locked
            </span>
            <span v-else>
              is invalid
            </span>
          </p>
          <ExternalLink class="btn btn-white mb-2" :href="'https://modtools.org/twitter/twitter_request.php?groupid=' + inv.group.id">
            Relink
          </ExternalLink>
        </div>
      </div>
    </NoticeMessage>
    <NoticeMessage v-if="notlinked.length" variant="warning" class="mt-1">
      <div v-if="summary">
        <v-icon name="exclamation-triangle" /> {{ notlinked.length | pluralize(['community needs', 'communities need'], { includeNumber: true }) }} to be linked to a Twitter account.
        <b-btn variant="white" @click="expand">
          Click to view
        </b-btn>
      </div>
      <div v-else>
        <p>Communities can be linked to a Twitter account, to get extra publicity. Some of your groups aren't.</p>
        <p>Please click to go to the Settings page where you can link from the <em>Social Media</em> section.</p>
        <div v-for="(inv) of notlinked" :key="'twnotlinked-' + inv.group.id">
          <nuxt-link :to="'/modtools/settings/' + inv.group.id">
            {{ inv.group.namedisplay }}
          </nuxt-link>
        </div>
      </div>
    </NoticeMessage>
  </div>
</template>
<script>
import NoticeMessage from './NoticeMessage'
const ExternalLink = () => import('~/components/ExternalLink')
export default {
  components: { NoticeMessage, ExternalLink },
  data: function() {
    return {
      summary: true
    }
  },
  computed: {
    invalid() {
      const ret = []

      for (const group of this.myGroups) {
        if (
          group.type === 'Freegle' &&
          (group.role === 'Moderator' || group.role === 'Owner') &&
          group.publish &&
          group.twitter &&
          (!group.twitter.valid || group.twitter.locked)
        ) {
          ret.push({
            account: group.twitter,
            group: group
          })
        }
      }

      return ret
    },
    notlinked() {
      const ret = []

      for (const group of this.myGroups) {
        if (
          group.type === 'Freegle' &&
          (group.role === 'Moderator' || group.role === 'Owner') &&
          group.publish
        ) {
          if (!group.twitter) {
            ret.push({
              group: group
            })
          }
        }
      }

      return ret
    }
  },
  methods: {
    expand() {
      this.summary = false
    }
  }
}
</script>
