<template>
  <div v-if="!hide">
    <div v-if="justPosted">
      <b-card no-body class="mb-1 bnuorder" :border-variant="expanded ? 'primary' : 'success'">
        <b-card-body class="p-2">
          <b-card-text class="d-flex justify-content-between flex-wrap">
            <div>
              <h3 class="text-wrap flex-shrink-2 mr-2 mb-0">
                {{ message.subject }}
                <b-badge v-if="message.availableinitially > 1" variant="info">
                  {{ message.availablenow ? message.availablenow : '0' }} left
                </b-badge>
              </h3>
              <read-more v-if="message && message.textbody" :text="message.textbody" :max-chars="maxChars" class="nopara" />
            </div>
            <div v-if="message.attachments.length > 0" class="clickme position-relative" @click="showPhotos">
              <div class="small">
                <b-badge v-if="message.attachments.length > 1" class="photobadge" variant="primary">
                  {{ message.attachments.length }} <v-icon name="camera" />
                </b-badge>
              </div>
              <b-img-lazy
                rounded
                thumbnail
                class="attachment p-0 square mb-1"
                generator-unable-to-provide-required-alt=""
                title="Item picture"
                :src="message.attachments[0].paththumb"
              />
            </div>
          </b-card-text>
        </b-card-body>
        <b-card-footer v-if="me" class="p-1">
          <div class="d-flex justify-content-start flex-wrap">
            <b-btn v-if="!rejected && !simple" variant="primary" title="Share" class="m-1" @click="share">
              <v-icon name="share-alt" /> Share
            </b-btn>
            <b-btn v-if="message.canedit && message.location && message.item" variant="secondary" class="m-1" @click="edit">
              <v-icon name="pen" /> Edit
            </b-btn>
            <b-btn v-if="!rejected && message.type === 'Offer' && !taken" variant="secondary" class="m-1" @click="outcome('Taken', $event)">
              <v-icon name="check" /> Mark as TAKEN
            </b-btn>
            <b-btn v-if="!rejected && message.type === 'Wanted' && !received" variant="secondary" class="m-1" @click="outcome('Received', $event)">
              <v-icon name="check" /> Mark as RECEIVED
            </b-btn>
            <b-btn v-if="!rejected && !taken && !received && !withdrawn" variant="secondary" class="m-1" @click="outcome( 'Withdrawn', $event)">
              <v-icon name="trash-alt" /> Withdraw
            </b-btn>
          </div>
        </b-card-footer>
      </b-card>
    </div>
    <div v-else-if="showOld || !message.outcomes || !message.outcomes.length">
      <b-card no-body class="mb-1 bnuorder" :border-variant="expanded ? 'primary' : 'success'">
        <b-card-header header-tag="header" class="p-1" role="tab">
          <b-button
            :v-b-toggle="'mypost-' + message.id"
            block
            variant="white"
            class="text-left text-truncate noborder hover p-1 p-md-2"
            @click="toggle"
          >
            <div class="d-flex justify-content-between">
              <div class="d-flex flex-column">
                <h3 class="text-wrap flex-shrink-2 mr-2 mb-0">
                  <span v-if="message.isdraft">
                    {{ message.type.toUpperCase() }}: {{ message.subject }} ({{ message.area.name }} {{ message.postcode.name }})
                  </span>
                  <span v-else>
                    {{ message.subject }}
                  </span>
                  <b-badge v-if="message.availableinitially > 1" variant="info">
                    {{ message.availablenow ? message.availablenow : '0' }} left
                  </b-badge>
                  <span v-if="rejected" class="text-danger">
                    <v-icon name="exclamation-triangle" scale="2" />
                  </span>
                </h3>
                <div v-for="group in message.groups" :key="'message-' + message.id + '-' + group.id" class="small text-muted text-wrap">
                  {{ timeago(group.arrival) }} on {{ group.namedisplay }} <nuxt-link :to="'/message/' + message.id">
                    <span class="text-muted small">#{{ message.id }}</span>
                  </nuxt-link>
                </div>
              </div>
              <span>
                <b-btn class="ml-1" variant="secondary">
                  <v-icon v-if="!expanded" name="caret-down" />
                  <v-icon v-else name="caret-up" />
                  <template slot="button-content" />
                </b-btn>
              </span>
            </div>
            <div class="d-flex flex-wrap">
              <div v-if="message.replycount > 0 && !expanded" class="mr-2">
                <b-badge variant="info">
                  <v-icon name="user" class="fa-fw" /> {{ message.replycount | pluralize(['reply', 'replies'], { includeNumber: true }) }}
                </b-badge>
              </div>
              <div v-if="message.outcomes && message.outcomes.length > 0" class="mr-2">
                <b-badge v-if="taken" variant="success">
                  <v-icon name="check" class="fa-fw" /> Taken
                </b-badge>
                <b-badge v-if="received" variant="success">
                  <v-icon name="check" class="fa-fw" /> Received
                </b-badge>
                <b-badge v-if="withdrawn" variant="secondary">
                  <v-icon name="check" class="fa-fw" /> Withdrawn
                </b-badge>
              </div>
              <div v-else-if="message.promisecount > 0" class="mr-2">
                <b-badge v-if="promisedTo.length === 0" variant="success">
                  <v-icon name="handshake" class="fa-fw" /> Promised
                </b-badge>
                <div v-else class="ml-1 text-info">
                  <MyMessagePromisedTo v-for="p in promisedTo" :key="'promised-' + p.id" :promise="p" :message="message" :replyusers="replyusers" />
                </div>
              </div>
              <div v-if="unseen > 0" class="mr-2">
                <b-badge variant="danger">
                  <v-icon name="comments" class="fa-fw" /> {{ unseen }} unread
                </b-badge>
              </div>
            </div>
            <hr class="">
            <div class="d-flex justify-content-between flex-wrap mt-1">
              <b-btn v-if="rejected && message.location && message.item" variant="warning" class="mr-2 mb-1" @click="repost">
                <v-icon class="d-none d-sm-inline" name="pen" /> Edit and Resend
              </b-btn>
              <b-btn v-if="rejected && !withdrawn" variant="secondary" class="mr-2 mb-1" @click="outcome('Withdrawn', $event)">
                <v-icon class="d-none d-sm-inline" name="trash-alt" /> Withdraw
              </b-btn>
              <b-btn v-if="!rejected && message.type === 'Offer' && !taken" variant="primary" class="mr-2 mb-1" @click="outcome('Taken', $event)">
                <v-icon class="d-none d-sm-inline" name="check" /> Mark as TAKEN
              </b-btn>
              <b-btn v-if="!rejected && message.type === 'Wanted' && !received" variant="primary" class="mr-2 mb-1" @click="outcome('Received', $event)">
                <v-icon class="d-none d-sm-inline" name="check" /> Mark as RECEIVED
              </b-btn>
              <b-btn v-if="!rejected && message.canedit && message.location && message.item" variant="secondary" class="mr-2 mb-1" @click="edit">
                <v-icon class="d-none d-sm-inline" name="pen" /> Edit
              </b-btn>
              <b-btn v-if="!rejected && !taken && !received && !withdrawn" variant="secondary" class="mr-2 mb-1" @click="outcome('Withdrawn', $event)">
                <v-icon class="d-none d-sm-inline" name="trash-alt" /> Withdraw
              </b-btn>
              <b-btn v-if="!rejected && message.canrepost && message.location && message.item" variant="secondary" class="mr-2 mb-1" @click="repost">
                <v-icon class="d-none d-sm-inline" name="sync" /> Repost
              </b-btn>
              <b-btn v-else-if="!rejected && !taken && !received && message.canrepostat && message.location && message.item" variant="secondary" disabled class="mr-2 mb-1" title="You will be able to repost this soon">
                <v-icon class="d-none d-sm-inline" name="sync" /> Repost <span class="small">{{ timeago(message.canrepostat) }}</span>
              </b-btn>
              <b-btn v-if="!rejected && !simple" variant="secondary" title="Share" class="mr-2 mb-1" @click="share">
                <v-icon class="d-none d-sm-inline" name="share-alt" /> Share
              </b-btn>
            </div>
          </b-button>
        </b-card-header>
        <b-collapse :id="'mypost-' + message.id" :visible="expanded" role="tabpanel" @show="expanded = true" @hidden="expanded = false">
          <div v-if="expanded">
            <b-card-body class="p-2">
              <b-card-text>
                <notice-message v-if="rejected" class="mb-3" variant="warning">
                  <v-icon name="exclamation-triangle" scale="2" /> This post has not been accepted and is not public yet.
                </notice-message>
                <div class="d-flex justify-content-between">
                  <div>
                    <span class="prewrap">
                      <read-more v-if="message && message.textbody" :text="message.textbody" :max-chars="maxChars" class="nopara" />
                    </span>
                  </div>
                  <div>
                    <div v-if="message.attachments.length > 0" class="clickme position-relative" @click="showPhotos">
                      <div class="small">
                        <b-badge v-if="message.attachments.length > 1" class="photobadge" variant="primary">
                          {{ message.attachments.length }} <v-icon name="camera" />
                        </b-badge>
                      </div>
                      <b-img-lazy
                        rounded
                        thumbnail
                        class="attachment p-0 square mb-1"
                        generator-unable-to-provide-required-alt=""
                        title="Item picture"
                        :src="message.attachments[0].paththumb"
                      />
                    </div>
                  </div>
                </div>
                <hr>
                <table v-if="replies.length > 0" class="table table-borderless table-striped mb-0">
                  <tbody>
                    <tr v-for="reply in replies" :key="'reply-' + reply.id">
                      <MyMessageReply
                        :reply="reply"
                        :chats="chats"
                        :message="message"
                        :taken="taken"
                        :received="received"
                        :withdrawn="withdrawn"
                        :closest="reply.user.id === closestUser"
                        :best="reply.user.id === bestRatedUser"
                        :quickest="reply.user.id === quickestUser"
                      />
                    </tr>
                  </tbody>
                </table>
                <p v-else class="text-muted">
                  No replies yet. <span v-if="willAutoRepost">Will auto-repost {{ timeago(message.canrepostat) }}.</span>
                </p>
              </b-card-text>
            </b-card-body>
          </div>
        </b-collapse>
      </b-card>
      <MessagePhotosModal
        v-if="expanded && message.attachments.length"
        :id="message.id"
        ref="photoModal"
      />
    </div>
    <OutcomeModal v-if="showOutcomeModal" ref="outcomeModal" :message="message" @outcome="hide = true" />
    <ShareModal v-if="showShareModal" :id="message.id" ref="shareModal" />
    <MessageEditModal v-if="showEditModal" ref="editModal" :message="message" />
    <PromiseModal v-if="showPromiseModal" ref="promiseModal" :messages="[ message ]" :selected-message="message.id" :users="replyusers" />
  </div>
</template>
<script>
import MessagePhotosModal from '@/components/MessagePhotosModal'
import MyMessagePromisedTo from '@/components/MyMessagePromisedTo'
import PromiseModal from '~/components/PromiseModal'
const MyMessageReply = () => import('./MyMessageReply.vue')
const ShareModal = () => import('./ShareModal')
const OutcomeModal = () => import('./OutcomeModal')
const MessageEditModal = () => import('./MessageEditModal')
const NoticeMessage = () => import('~/components/NoticeMessage')

let ResizeText = null

if (process.client) {
  ResizeText = require('vue-resize-text')
}

export default {
  directives: {
    ResizeText
  },
  components: {
    MyMessagePromisedTo,
    MessagePhotosModal,
    PromiseModal,
    OutcomeModal,
    ShareModal,
    MyMessageReply,
    MessageEditModal,
    NoticeMessage
  },

  props: {
    message: {
      type: Object,
      required: true
    },
    showOld: {
      type: Boolean,
      required: true
    },
    expand: {
      type: Boolean,
      required: false,
      default: false
    },
    action: {
      type: String,
      required: false,
      default: null
    },
    justPosted: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  data: function() {
    return {
      maxChars: 60,
      expanded: false,
      hide: false,
      showOutcomeModal: false,
      showEditModal: false,
      showShareModal: false,
      showPromiseModal: false
    }
  },
  computed: {
    unseen() {
      // We want all the chats from replies.  We fetch them in myposts, here we only need to
      // get them from the store
      const chats = this.$store.getters['chats/list']
      let unseen = 0

      if (this.message && this.message.replies) {
        for (const reply of this.message.replies) {
          for (const chat of chats) {
            if (chat.id === reply.chatid) {
              unseen += chat.unseen
            }
          }
        }
      }

      return unseen
    },
    taken() {
      return this.hasOutcome('Taken')
    },
    received() {
      return this.hasOutcome('Received')
    },
    withdrawn() {
      return this.hasOutcome('Withdrawn')
    },
    rejected() {
      let rejected = false

      for (const group of this.message.groups) {
        if (group.collection === 'Rejected') {
          rejected = true
        }
      }

      return rejected
    },
    replies() {
      if (this.message.isdraft) {
        return []
      } else {
        // Show the replies with unseen messages first, then most recent
        // console.log('Sort replies', this.message.replies, this)
        const self = this
        return [...this.message.replies].sort((a, b) => {
          const aunseen = self.countUnseen(a)
          const bunseen = self.countUnseen(b)
          const adate = new Date(a.lastdate).getTime()
          const bdate = new Date(b.lastdate).getTime()

          // console.log('Unseen', aunseen, bunseen, adate, bdate)
          if (aunseen !== bunseen) {
            return bunseen - aunseen
          } else {
            return bdate - adate
          }
        })
      }
    },
    closestUser() {
      let ret = null
      let dist = null

      if (this.replyusers.length > 1) {
        this.replyusers.forEach(u => {
          if (dist === null || (u.info && u.info.milesaway < dist)) {
            dist = u.info.milesaway
            ret = u.id
          }
        })
      }

      return ret
    },
    bestRatedUser() {
      let ret = null
      let rating = null

      if (this.replyusers.length > 1) {
        this.replyusers.forEach(u => {
          if (
            u.info &&
            u.info.ratings &&
            u.info.ratings.Up + u.info.ratings.Down > 0
          ) {
            const thisrating =
              u.info.ratings.Up / (u.info.ratings.Up + u.info.ratings.Down)

            if (
              u.info.ratings.Up > u.info.ratings.Down &&
              (rating === null || thisrating > rating)
            ) {
              rating = thisrating
              ret = u.id
            }
          }
        })
      }

      return ret
    },
    quickestUser() {
      let ret = null
      let replytime = null

      if (this.replyusers.length > 1) {
        this.replyusers.forEach(u => {
          if (
            u.info &&
            u.info.replytime &&
            (replytime === null ||
              (u.info.replytime && u.info.replytime < replytime))
          ) {
            replytime = u.info.replytime
            ret = u.id
          }
        })
      }

      return ret
    },
    replyusers() {
      const ret = []
      const retids = []

      if (this.message && this.message.replies) {
        for (const reply of this.message.replies) {
          if (retids.indexOf(reply.user.id) === -1) {
            ret.push(reply.user)
            retids[reply.userid] = true
          }
        }
      }

      return ret
    },
    chats() {
      // We want all the chats which reference this message.  We fetch them in myposts, here we only need to
      // get them from the store
      const chats = this.$store.getters['chats/list']
      const ret = []

      for (const chat of chats) {
        if (chat.refmsgids) {
          if (chat.refmsgids.indexOf(this.message.id) !== -1) {
            // This chat references this message
            ret.push(chat)
          }
        }
      }

      return ret
    },
    promisedTo() {
      const ret = []

      if (
        this.expanded &&
        this.message.promises &&
        this.message.promises.length
      ) {
        this.message.promises.forEach(p => {
          const user = this.$store.getters['user/get'](p.userid)

          if (user) {
            const tryst = this.$store.getters['tryst/getByUser'](p.userid)
            const date = tryst
              ? this.$dayjs(tryst.arrangedfor).format('dddd Do HH:mm a')
              : null

            ret.push({
              id: p.userid,
              name: user.displayname,
              tryst: tryst,
              trystdate: date
            })
          }
        })
      }

      return ret
    },
    willAutoRepost() {
      if (this.taken || this.received || !this.message.canrepostat) {
        return false
      }

      const d = this.$dayjs(this.message.canrepostat)
      const now = this.$dayjs()
      console.log(this.message.canrepostat, d, now)

      return d.isAfter(now)
    }
  },
  watch: {
    message: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          // We may need to fetch user info for promises.
          if (newVal.promises) {
            newVal.promises.forEach(p => {
              const user = this.$store.getters['user/get'](p.userid)
              if (!user) {
                this.$store.dispatch('user/fetch', {
                  id: p.userid
                })
              }
            })
          }
        }
      }
    }
  },
  mounted() {
    this.expanded = this.expand

    if (this.me) {
      switch (this.action) {
        case 'repost':
          if (this.message.canrepost) {
            this.repost()
          }
          break
        case 'withdraw':
          this.outcome('Withdrawn')
          break
        case 'taken':
          this.outcome('Taken')
          break
        case 'received':
          this.outcome('Received')
          break
        case 'promise':
          this.showPromiseModal = true
          this.waitForRef('promiseModal', () => {
            this.$refs.promiseModal.show()
          })
          break
      }
    }
  },
  methods: {
    toggle() {
      this.$root.$emit('bv::toggle::collapse', 'mypost-' + this.message.id)
    },
    showPhotos() {
      this.waitForRef('photoModal', () => {
        this.$refs.photoModal.show()
      })
    },
    countUnseen(reply) {
      let unseen = 0

      for (const chat of this.chats) {
        if (chat.id === reply.chatid) {
          unseen = chat.unseen
        }
      }

      return unseen
    },
    outcome(type, e) {
      console.log('outcome', type, e)
      if (e) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
      }

      this.showOutcomeModal = true
      this.waitForRef('outcomeModal', () => {
        this.$refs.outcomeModal.show(type)
      })
    },
    share(e) {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
      }

      this.showShareModal = true
      this.waitForRef('shareModal', () => {
        this.$refs.shareModal.show()
      })
    },
    edit(e) {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
      }

      this.showEditModal = true
      this.waitForRef('editModal', () => {
        this.$refs.editModal.show()
      })
    },
    async repost(e) {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
      }

      // Remove any partially composed messages we currently have, because they'll be confusing.
      await this.$store.dispatch('compose/clearMessages')

      // Add this message to the compose store so that it will show up on the compose page.
      await this.$store.dispatch('compose/setMessage', {
        id: this.message.id,
        savedBy: this.message.fromuser,
        item: this.message.item.name.trim(),
        description: this.message.textbody
          ? this.message.textbody.trim()
          : null,
        availablenow: this.message.availablenow,
        type: this.message.type
      })

      // Set the current location and nearby groups, too, since we're about to use them
      if (this.message.location) {
        const loc = await this.$axios.get(process.env.API + '/locations', {
          params: {
            typeahead: this.message.location.name
          }
        })

        await this.$store.dispatch('compose/setPostcode', loc.data.locations[0])
      }

      await this.$store.dispatch('compose/setAttachmentsForMessage', {
        id: this.message.id,
        attachments: this.message.attachments
      })

      this.$router.push(this.message.type === 'Offer' ? '/give' : '/find')
    },
    hasOutcome(val) {
      let ret = false

      if (this.message.outcomes && this.message.outcomes.length) {
        for (const outcome of this.message.outcomes) {
          if (outcome.outcome === val) {
            ret = true
          }
        }
      }

      return ret
    }
  }
}
</script>
<style scoped lang="scss">
@import 'color-vars';

.square {
  object-fit: cover;
  width: 75px;
  height: 75px;
}

img.attachment {
  max-height: 75px !important;
  max-width: 75px !important;
}

.photobadge {
  right: 5px;
  position: absolute;
  top: 5px;
}

.noborder {
  border: none !important;
  border-color: $color-white !important;
}

.hover:hover {
  color: initial;
  background-color: $colour-success-bg !important;
}
</style>
