<template>
  <b-card v-if="user" no-body class="p-0">
    <b-card-header class="clickme p-1" @click="maybeExpand">
      <b-row>
        <b-col cols="10" sm="4" class="order-1 truncate" :title="user.email">
          <div>
            <v-icon name="envelope" />&nbsp;{{ user.email }}
          </div>
          <div v-if="user.tnuserid" class="text-muted small">
            TN user id <v-icon name="hashtag" scale="0.6" />{{ user.tnuserid }}
          </div>
        </b-col>
        <b-col cols="2" sm="1" class="order-2 order-sm-7">
          <span class="d-block d-sm-none float-right">
            <v-icon v-if="!expanded" name="caret-down" />
            <v-icon v-else name="caret-up" />
          </span>
          <b-btn variant="white" size="sm" class="d-none d-sm-block float-right">
            <v-icon v-if="!expanded" name="caret-down" />
            <v-icon v-else name="caret-up" />
          </b-btn>
        </b-col>
        <b-col cols="12" sm="3" class="order-3 truncate">
          <v-icon name="user" /> {{ user.displayname }}
        </b-col>
        <b-col cols="5" sm="2" class="order-4">
          <v-icon name="hashtag" scale="0.75" class="text-muted" />{{ user.id }}
        </b-col>
        <b-col cols="7" sm="2" class="order-5 text-right">
          {{ timeago(user.lastaccess) }}
        </b-col>
      </b-row>
    </b-card-header>
    <b-card-body v-if="expanded" class="p-1">
      <ModBouncing v-if="user.bouncing" :user="user" class="mb-2" />
      <NoticeMessage v-if="user.systemrole === 'Admin'" class="mb-2">
        This user has admin rights.
      </NoticeMessage>
      <NoticeMessage v-if="user.systemrole === 'Support'" class="mb-2">
        This user has support rights.
      </NoticeMessage>
      <ModSpammer v-if="user.spammer" class="mb-2" :user="user" />
      <ModComments :user="user" />

      <div class="d-flex flex-wrap">
        <b-btn variant="white" class="mr-2 mb-1" @click="spamReport">
          <v-icon name="ban" /> Spammer
        </b-btn>
        <b-btn variant="white" class="mr-2 mb-1" @click="purge">
          <v-icon name="trash-alt" /> Purge
        </b-btn>
        <b-btn variant="white" class="mr-2 mb-1" :href="user.loginlink" target="_blank" rel="noopener noreferrer">
          <v-icon name="user" /> Impersonate - must right-click and open in Incognito/Private window
        </b-btn>
        <b-btn
          v-if="admin"
          variant="white"
          class="mr-2 mb-1"
          :href="user.loginlink ? user.loginlink.replace(/http.*\?u/, 'http://localhost:3000/?u') : null"
          target="_blank"
          rel="noopener noreferrer"
        >
          <v-icon name="user" /> Impersonate (localhost:3000)
        </b-btn>
        <ModMergeButton class="mr-2 mb-1" />
        <b-btn variant="white" class="mr-2 mb-1" @click="logs">
          <v-icon name="book-open" /> Logs
        </b-btn>
        <b-btn variant="white" class="mr-2 mb-1" @click="profile">
          <v-icon name="user" /> Profile
        </b-btn>
        <b-btn variant="white" class="mr-2 mb-1" @click="addAComment">
          <v-icon name="tag" /> Add note
        </b-btn>
      </div>
      <h3 class="mt-2">
        Trust Level
      </h3>
      <p>
        This controls whether someone is asked to do micromoderation tasks.
      </p>
      <p>
        <span v-if="!user.trustlevel"><strong>None</strong> - we've not yet asked them</span>
        <span v-else-if="user.trustlevel === 'Basic'"><strong>Basic</strong> - has consented, using information visible to all members</span>
        <span v-else-if="user.trustlevel === 'Moderate'"><strong>Moderate</strong> - some information not visible to all members</span>
        <span v-else-if="user.trustlevel === 'Advanced'"><strong>Advanced</strong> - significant information not visible to all members</span>
        <span v-else-if="user.trustlevel === 'Declined'"><strong>Declined</strong> - said they don't want to do this</span>
        <span v-else-if="user.trustlevel === 'Disabled'"><strong>Disabled</strong> - prevented by a mod</span>
      </p>
      <div v-if="user.giftaid">
        <h3 class="mt-2">
          Gift Aid
        </h3>
        <p>
          Gift Aid consent <v-icon name="hashtag" scale="0.8" />{{ user.giftaid.id }} given on {{ dateonly(user.giftaid.timestamp) }} for
          <span v-if="user.giftaid.period === 'Since'">
            donations since this date.
          </span>
          <span v-if="user.giftaid.period === 'This'">
            this donation only.
          </span>
          <span v-if="user.giftaid.period === 'Future'">
            this and future donations.
          </span>
        </p>
      </div>
      <div v-if="user.donations">
        <h3 class="mt-2">
          Donations
        </h3>
        <div v-for="d in user.donations" :key="'donation-' + d.id">
          &pound;{{ d.GrossAmount }} on {{ dateshort(d.timestamp ) }} <span class="small text-muted">via {{ d.source }}</span>
          <span v-if="d.source === 'PayPalGivingFund' || d.source === 'eBay' || d.source === 'Facebook'" class="small text-muted">
            (Gift Aid claimed by them not us)
          </span>
        </div>
      </div>
      <h3 class="mt-2">
        Location
      </h3>
      <b-row>
        <b-col cols="12" md="6">
          <div class="d-flex justify-content-between">
            <div>
              <v-icon class="text-muted" name="globe-europe" /> Location on ChitChat
            </div>
            <div v-if="user.info && user.info.publiclocation">
              {{ user.info.publiclocation.display }}
            </div>
            <div v-else>
              Unknown
            </div>
          </div>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="12" md="6">
          <div class="d-flex justify-content-between">
            <div>
              <v-icon class="text-muted" name="lock" /> Best guess lat/lng
            </div>
            <div v-if="user.privateposition">
              <div v-if="user.privateposition.lat || user.privateposition.lng">
                {{ Math.round(user.privateposition.lat * 100) / 100 }}, {{ Math.round(user.privateposition.lng * 100) / 100 }}
                <a :href="'https://www.google.com/maps?q=' + user.privateposition.lat + ',' + user.privateposition.lng" target="_blank" rel="noopener">Show on map</a>
              </div>
              <div v-else>
                Not known
              </div>
            </div>
            <div v-else>
              Not known
            </div>
          </div>
        </b-col>
      </b-row>
      <h3 class="mt-2">
        Logins
      </h3>
      <ModMemberLogins :member="user" />
      <div class="d-flex justify-content-between flex-wrap">
        <b-input-group class="mt-2">
          <b-input
            v-model="newpassword"
            type="text"
            placeholder="Reset password"
            autocomplete="off"
            class="max"
          />
          <b-input-group-append>
            <SpinButton variant="white" name="save" label="Set Password" :handler="setPassword" />
          </b-input-group-append>
        </b-input-group>
        <b-input-group class="mt-2">
          <b-input
            v-model="newemail"
            type="text"
            placeholder="Add email"
            autocomplete="off"
            class="max"
          />
          <b-input-group-append>
            <SpinButton variant="white" name="save" label="Add Email" :handler="addEmail" />
          </b-input-group-append>
        </b-input-group>
      </div>
      <h3 class="mt-2">
        Notifications
      </h3>
      <div v-if="user.lastpush">
        Last push notification: {{ timeago(user.lastpush) }}
      </div>
      <div v-else>
        No push notifications sent.
      </div>
      <h3 class="mt-2">
        Memberships
      </h3>
      <div v-if="memberships && memberships.length">
        <div v-for="membership in memberships" :key="'membership-' + membership.id">
          <ModSupportMembership :membership="membership" :userid="user.id" />
        </div>
        <b-btn v-if="!showAllMemberships && membershipsUnshown" variant="white" class="mt-1" @click="showAllMemberships = true">
          Show +{{ membershipsUnshown }}
        </b-btn>
      </div>
      <p v-else>
        No memberships.
      </p>
      <div v-if="user.bans">
        <div v-for="ban in user.bans" :key="'ban-' + ban.date" class="text-danger">
          Banned on {{ ban.group }} by {{ ban.byemail }} {{ timeago(ban.date) }}
        </div>
      </div>
      <h3 class="mt-2">
        Other Known Emails
      </h3>
      <div v-if="otherEmails && otherEmails.length">
        <div v-for="otheremail in otherEmails" :key="'otheremail-' + otheremail.id">
          {{ otheremail.email }}
          <span class="text-muted" :title="otheremail.added.toLocaleString()">
            added {{ timeago(otheremail.added) }}
          </span>
        </div>
      </div>
      <p v-else>
        No other emails.
      </p>
      <h3 class="mt-2">
        Membership History
      </h3>
      <h4>Recent Applications</h4>
      <div v-if="user.applied && user.applied.length">
        <div v-for="applied in user.applied" :key="'applied-' + id + '-' + applied.added">
          {{ applied.nameshort }}
          <span class="text-muted" :title="applied.added.toLocaleString()">
            {{ timeago(applied.added) }}
          </span>
        </div>
      </div>
      <div v-else>
        No recent applications.
      </div>
      <h4 class="mt-2">
        Full History
      </h4>
      <div v-if="membershipHistoriesShown.length">
        <div v-for="membershiphistory in membershipHistoriesShown" :key="'membershiphistory-' + membershiphistory.timestamp">
          {{ membershiphistory.group.nameshort }}
          <span class="text-muted" :title="membershiphistory.timestamp.toLocaleString()">
            {{ timeago(membershiphistory.timestamp) }}
          </span>
        </div>
        <b-btn v-if="!showAllMembershipHistories && membershipHistoriesUnshown" variant="white" class="mt-1" @click="showAllMembershipHistories = true">
          Show +{{ membershipsUnshown }}
        </b-btn>
      </div>
      <div v-else>
        No application history.
      </div>
      <h3 class="mt-2">
        Posting History
      </h3>
      <ModMemberSummary :member="user" />
      <div v-if="messageHistoriesShown.length">
        <b-row
          v-for="message in messageHistoriesShown"
          :key="'messagehistory-' + message.arrival + '-' + message.id"
          :class="{
            'pl-3': true,
            strike: message.deleted
          }"
        >
          <b-col cols="4" md="2" class="order-1 p-1 small">
            {{ datetimeshort(message.arrival) }}
          </b-col>
          <b-col cols="4" md="2" class="order-3 order-md-2 p-1 small">
            <ExternalLink :href="'https://www.ilovefreegle.org/message/' + message.id">
              <v-icon name="hashtag" class="text-muted" scale="0.75" />{{ message.id }}
            </ExternalLink>
            <span :class="message.collection != 'Approved' ? 'text-danger' : 'text-muted'">{{ message.collection }}</span>
            <br>
            <span class="text-muted">{{ message.groupname }}</span>
          </b-col>
          <b-col cols="8" md="6" class="order-2 order-md-3 p-1">
            {{ message.subject }}
            <span v-if="message.outcome" class="text-info small">
              {{ message.outcome }}
            </span>
          </b-col>
          <b-col cols="6" md="2" class="small order-4 p-1">
            {{ message.fromaddr }}
          </b-col>
        </b-row>
        <b-btn v-if="!showAllMessageHistories && messageHistoriesUnshown" variant="white" class="mt-1" @click="showAllMessageHistories = true">
          Show +{{ messageHistoriesUnshown }}
        </b-btn>
      </div>
      <p v-else>
        No posting history.
      </p>
      <h3 class="mt-2">
        Recent Emails
      </h3>
      <div v-if="emailHistoriesShown.length">
        <b-row v-for="email in emailHistoriesShown" :key="'emailhistory-' + email.id" class="pl-3">
          <b-col cols="6" md="3" class="p-1 order-1" :title="datetime(email.timestamp)">
            {{ timeago(email.timestamp) }}
          </b-col>
          <b-col cols="12" md="6" class="p-1 order-3 order-md-2">
            {{ email.subject }}
          </b-col>
          <b-col cols="5" md="3" class="p-1 order-2 order-md-3 small text-muted">
            {{ email.status }}
          </b-col>
        </b-row>
        <b-btn v-if="!showAllEmailHistories && emailHistoriesUnshown" variant="white" class="mt-1" @click="showAllEmailHistories = true">
          Show +{{ emailHistoriesUnshown }}
        </b-btn>
      </div>
      <p v-else>
        No recent emails.
      </p>
      <h3 class="mt-2">
        Chats
      </h3>
      <ModSupportChatList :chats="chatsFiltered" :pov="user.id" />
    </b-card-body>
    <ModLogsModal ref="logs" :userid="user.id" />
    <ConfirmModal v-if="purgeConfirm" ref="purgeConfirm" :title="'Purge ' + user.displayname + ' from the system?'" message="<p><strong>This can't be undone.</strong></p><p>Are you completely sure you want to do this?</p>" @confirm="purgeConfirmed" />
    <ProfileModal v-if="user && user.info" :id="id" ref="profile" />
    <ModSpammerReport v-if="showSpamModal" ref="spamConfirm" :user="reportUser" />
    <ModCommentAddModal v-if="addComment" ref="addComment" :user="user" @added="updateComments" />
  </b-card>
</template>
<script>
import ModSupportMembership from './ModSupportMembership'
import ModLogsModal from './ModLogsModal'
import ConfirmModal from './ConfirmModal'
import ProfileModal from './ProfileModal'
import ModSupportChatList from './ModSupportChatList'
import ModSpammer from './ModSpammer'
import ModMemberLogins from './ModMemberLogins'
import ModComments from './ModComments'
import ModSpammerReport from './ModSpammerReport'
import SpinButton from './SpinButton'
import NoticeMessage from './NoticeMessage'
import ModMergeButton from './ModMergeButton'
import ModMemberSummary from './ModMemberSummary'
import ModBouncing from '~/components/ModBouncing'
const ExternalLink = () => import('~/components/ExternalLink')
const ModCommentAddModal = () => import('~/components/ModCommentAddModal')

const SHOW = 3

export default {
  components: {
    ModBouncing,
    ModMemberSummary,
    ModMergeButton,
    NoticeMessage,
    SpinButton,
    ModSpammerReport,
    ModComments,
    ModMemberLogins,
    ModSpammer,
    ModSupportChatList,
    ProfileModal,
    ConfirmModal,
    ModLogsModal,
    ModSupportMembership,
    ExternalLink,
    ModCommentAddModal
  },

  props: {
    id: {
      type: Number,
      required: true
    },
    expand: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  data: function() {
    return {
      expanded: true,
      purgeConfirm: false,
      showAllMemberships: false,
      showAllMembershipHistories: false,
      showAllMessages: false,
      showAllMessageHistories: false,
      showAllEmailHistories: false,
      showSpamModal: false,
      newpassword: null,
      newemail: null,
      addComment: false
    }
  },
  computed: {
    user() {
      const u = this.$store.getters['user/get'](this.id)
      u.userid = this.id
      return u
    },
    reportUser() {
      return {
        // Due to inconsistencies about userid vs id in objects.
        userid: this.user.id,
        displayname: this.user.displayname
      }
    },
    freegleMemberships() {
      return this.user && this.user.memberof
        ? this.user.memberof
            .filter(m => m.type === 'Freegle')
            .sort(function(a, b) {
              return a.nameshort
                .toLowerCase()
                .localeCompare(b.nameshort.toLowerCase())
            })
        : []
    },
    memberships() {
      return this.showAllMemberships
        ? this.freegleMemberships
        : this.freegleMemberships.slice(0, SHOW)
    },
    membershipsUnshown() {
      const ret =
        this.freegleMemberships.length > SHOW
          ? this.freegleMemberships.length - SHOW
          : 0
      return ret
    },
    otherEmails() {
      return this.user.emails.filter(e => {
        return e.email !== this.user.email && !e.ourdomain
      })
    },
    membershiphistories() {
      const times = []
      const ret = []

      if (this.user && this.user.membershiphistory) {
        this.user.membershiphistory.forEach(h => {
          if (times.indexOf(h.timestamp) === -1) {
            times.push(h.timestamp)
            ret.push(h)
          }
        })
      }

      return ret
    },
    membershipHistoriesShown() {
      return this.showAllMembershipHistories
        ? this.membershiphistories
        : this.membershiphistories.slice(0, SHOW)
    },
    membershipHistoriesUnshown() {
      const ret =
        this.membershiphistories.length > SHOW
          ? this.membershiphistories.length - SHOW
          : 0
      return ret
    },
    messageHistoriesShown() {
      return this.showAllMessageHistories
        ? this.user.messagehistory
        : this.user.messagehistory.slice(0, SHOW)
    },
    messageHistoriesUnshown() {
      const ret =
        this.user.messagehistory.length > SHOW
          ? this.user.messagehistory.length - SHOW
          : 0
      return ret
    },
    sortedHistories() {
      const ret =
        this.user.emailhistory && this.user.emailhistory.length
          ? this.user.emailhistory
          : []

      ret.sort(function(a, b) {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })

      return ret
    },
    emailHistoriesShown() {
      return this.showAllEmailHistories
        ? this.sortedHistories
        : this.sortedHistories.slice(0, SHOW)
    },
    emailHistoriesUnshown() {
      const ret =
        this.user.emailhistory.length > SHOW
          ? this.user.emailhistory.length - SHOW
          : 0
      return ret
    },
    chatsFiltered() {
      return this.user.chatrooms
        ? this.user.chatrooms
            .filter(c => c.chattype !== 'Mod2Mod')
            .sort((a, b) => {
              return (
                new Date(b.lastdate).getTime() - new Date(a.lastdate).getTime()
              )
            })
        : []
    }
  },
  mounted() {
    this.expanded = this.expand
  },
  methods: {
    logs() {
      this.$refs.logs.show()
    },
    async profile() {
      await this.$store.dispatch('user/fetch', {
        id: this.id,
        info: true
      })

      this.$refs.profile.show()
    },
    purgeConfirmed() {
      this.$store.dispatch('members/purge', {
        userid: this.id
      })
    },
    purge() {
      this.purgeConfirm = true

      this.waitForRef('purgeConfirm', () => {
        this.$refs.purgeConfirm.show()
      })
    },
    spamReport() {
      this.showSpamModal = true
      this.waitForRef('spamConfirm', () => {
        this.$refs.spamConfirm.show()
      })
    },
    async setPassword() {
      if (this.newpassword) {
        await this.$store.dispatch('user/edit', {
          id: this.user.id,
          password: this.newpassword
        })
      }
    },
    async addEmail() {
      if (this.newemail) {
        await this.$store.dispatch('user/addEmail', {
          id: this.user.id,
          email: this.newemail
        })
      }
    },
    maybeExpand() {
      // Ignore text selection
      if (!window.getSelection().toString()) {
        this.expanded = !this.expanded
      }
    },
    addAComment() {
      this.addComment = true
      this.waitForRef('addComment', () => {
        this.$refs.addComment.show()
      })
    },
    async updateComments() {
      // The server API doesn't make it easy to refresh comments on memberships, because we can't refetch a
      // specific membership id.  Instead fetch the user and then pass any comments to the store to update there.
      await this.$store.dispatch('user/fetch', {
        id: this.user.id,
        info: true
      })

      const user = this.$store.getters['user/get'](this.user.id)

      await this.$store.dispatch('members/updateComments', {
        userid: this.user.id,
        comments: user.comments
      })
    }
  }
}
</script>
<style scoped>
.max {
  max-width: 200px;
}
</style>
