<template>
  <div>
    <client-only>
      <ScrollToTop :prepend="groupName" />
      <div class="d-flex justify-content-between flex-wrap">
        <GroupSelect v-model="groupid" all modonly remember="approved" />
        <ModFindMessagesFromMember @searched="searchedMember" />
        <ModFindMessage v-if="groupid" :groupid="groupid" @searched="searchedMessage" />
        <span v-else class="mt-2">
          Select a community to search messages.
        </span>
        <ModtoolsViewControl />
      </div>
      <div>
        <div v-for="message in visibleMessages" :key="'messagelist-' + message.id" class="p-0 mt-2">
          <ModMessage :message="message" :summary="summary" :search="messageTerm" />
        </div>

        <NoticeMessage v-if="!messages.length && !busy" class="mt-2">
          There are no messages at the moment.  This will refresh automatically.
        </NoticeMessage>

        <infinite-loading :key="'infinite-' + groupid + '-' + bump" force-use-infinite-wrapper="body" :distance="distance" @infinite="loadMore">
          <span slot="no-results" />
          <span slot="no-more" />
          <span slot="spinner">
            <b-img-lazy src="~/static/loader.gif" alt="Loading" />
          </span>
        </infinite-loading>
      </div>
    </client-only>
  </div>
</template>
<script>
import loginRequired from '@/mixins/loginRequired'
import modMessagesPage from '@/mixins/modMessagesPage'
import createGroupRoute from '@/mixins/createGroupRoute'
import NoticeMessage from '../../../../components/NoticeMessage'
import ModMessage from '../../../../components/ModMessage'
import GroupSelect from '../../../../components/GroupSelect'
import ModFindMessage from '../../../../components/ModFindMessage'
import ModFindMessagesFromMember from '../../../../components/ModFindMessagesFromMember'
import ModtoolsViewControl from '../../../../components/ModtoolsViewControl'
import ScrollToTop from '../../../../components/ScrollToTop'

export default {
  components: {
    ScrollToTop,
    ModtoolsViewControl,
    ModFindMessagesFromMember,
    ModFindMessage,
    GroupSelect,
    ModMessage,
    NoticeMessage
  },
  layout: 'modtools',
  mixins: [
    loginRequired,
    createGroupRoute('modtools/messages/approved'),
    modMessagesPage
  ],
  data: function() {
    return {
      collection: 'Approved',
      bump: 0
    }
  },
  computed: {
    groupName() {
      if (this.groupid) {
        return this.$store.getters['group/get'](this.groupid)?.namedisplay
      }

      return null
    },
    summary() {
      const ret = this.$store.getters['misc/get'](
        'modtoolsMessagesApprovedSummary'
      )
      return ret === undefined ? false : ret
    }
  },
  watch: {
    summary(newVal) {
      // Re-render the infinite scroll in case we need to fetch more.
      this.bump++
      this.checkLimit()
    }
  },
  mounted() {
    this.checkLimit()
  },
  methods: {
    checkLimit() {
      this.limit = this.summary ? 10 : 2
    },
    searchedMessage(term) {
      this.messageTerm = term
      this.memberTerm = null

      // Need to rerender the infinite scroll
      this.bump++
    },
    searchedMember(term) {
      this.messageTerm = null
      this.memberTerm = term

      // Need to rerender the infinite scroll
      this.bump++
    }
  }
}
</script>
