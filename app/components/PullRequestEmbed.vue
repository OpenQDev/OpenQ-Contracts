<template>
  <div class="embed rounded-bottom p-2 mb-2">
    <div class="d-flex">
      <span :class="'d-flex align-items-center badge badge-pill pl-1 mr-1 badge-' + (contribution.state === 'open' ? 'success' : (contribution.merged ? 'merged' : 'success'))">
        <MergeIcon width="16px" height="16px" class="mr-1" v-if="contribution.merged" />
        <InfoIcon width="16px" height="16px" class="mr-1" v-else />
        {{ contribution.merged ? 'merged' : contribution.state }}
      </span>
      <a :href="contribution.html_url" target="_blank" class="text-truncate text-dark" :title="contribution.title">
        <b>{{ contribution.title }}</b>
      </a>
      <span class="text-muted ml-auto pl-1 text-nowrap">
        #{{ contribution.number }}
      </span>
    </div>
    <small class="d-flex justify-content-between text-muted mt-1 mb-2">
      <span>
        {{ contribution.createdAt | moment("MMMM Do YYYY") }}
        <span class="text-dark">by</span>
        <a :href="contribution.author.url" target="_blank">
          <b>{{ githubUser.login === contribution.author.login ? 'you' : contribution.author.login }}</b>
        </a>
      </span>
      <span>
        <font-awesome-icon :icon="['far', 'comment-alt']" class="ml-1" />
        {{ contribution.comments.totalCount }}
      </span>
    </small>
  </div>
</template>

<script>
import { mapGetters } from "vuex"
import helpers from '@/mixins/helpers'

export default {
  props: ['contribution'],
  mixins: [helpers],
  computed: {
    ...mapGetters("github", { githubUser: 'user' })
  }
}
</script>
