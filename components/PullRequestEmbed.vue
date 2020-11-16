<template>
  <div class="embed rounded-bottom p-2 mb-2">
    <div class="d-flex">
      <span :class="'d-flex align-items-center badge badge-pill pl-1 mr-1 badge-' + (contribution.pullRequest.state === 'open' ? 'success' : (contribution.pullRequest.merged ? 'merged' : 'danger'))">
        <MergeIcon width="16px" height="16px" class="mr-1" v-if="contribution.pullRequest.merged" />
        <InfoIcon width="16px" height="16px" class="mr-1" v-else />
        {{ contribution.pullRequest.merged ? 'merged' : contribution.pullRequest.state }}
      </span>
      <a :href="contribution.pullRequest.html_url" target="_blank" class="text-truncate text-dark" :title="contribution.pullRequest.title">
        <b>{{ contribution.pullRequest.title }}</b>
      </a>
      <span class="text-muted ml-auto pl-1 text-nowrap">
        #{{ contribution.pullRequest.number }}
      </span>
    </div>
    <small class="d-flex justify-content-between text-muted mt-1 mb-2">
      <span>
        {{ contribution.pullRequest.createdAt | moment("MMMM Do YYYY") }}
        <span class="text-dark">by</span>
        <a :href="contribution.pullRequest.author.url" target="_blank">
          <b>{{ githubUser.login === contribution.pullRequest.author.login ? 'you' : contribution.pullRequest.author.login }}</b>
        </a>
      </span>
      <span>
        <font-awesome-icon :icon="['far', 'comment-alt']" class="ml-1" />
        {{ contribution.pullRequest.comments.totalCount }}
      </span>
    </small>
    <small class="d-flex justify-content-between text-muted mt-2">
      <span>Score:</span>
      <span>
        50
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
    ...mapGetters("github", { githubUser: 'user' }),
    repoAge() {
      return Math.floor(this.getAge(this.contribution.createdAt))
    },
    repoAdmin() {
      return this.contribution.viewerCanAdminister
    },
    repoStars() {
      return this.contribution.stargazers.totalCount
    },
    isValid() {
      return !this.repoAdmin && this.repoAge > 90 && this.repoStars > 50
    }
  }
}
</script>
