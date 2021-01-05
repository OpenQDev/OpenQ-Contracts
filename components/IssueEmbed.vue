<template>
  <div class="border rounded-xl px-3 pb-3 mb-2" style="margin-top: -56px; padding-top: 56px; border-color: #f2f2f2 !important">
    <div class="d-flex">
      <span :class="'d-flex align-items-center badge badge-pill pl-1 mr-1 badge-' + (issue.closed ? 'danger' : 'success')">
        <InfoIcon width="16px" height="16px" class="mr-1" />
        {{ issue.closed ? 'closed' : 'open' }}
      </span>
      <a :href="issue.url" target="_blank" class="text-truncate text-dark" :title="issue.title">
        <b>{{ issue.title }}></b>
      </a>
      <span class="text-muted ml-1">#{{ issue.number }}</span>
    </div>
    <small class="d-flex justify-content-between text-muted mt-1">
      <span>
        created
        {{ issue.createdAt | moment("MMM Do YYYY") }}
        <span class="text-dark">by</span>
        <a :href="issue.author.url" target="_blank" class="text-muted">
          <b>{{ githubUser && githubUser.login === issue.author.login ? 'you' : issue.author.login }}</b>
        </a>
      </span>
      <span>
        <font-awesome-icon :icon="['far', 'comment-alt']" />
        {{ issue.comments.totalCount }}
      </span>
    </small>
  </div>
</template>

<script>
import { mapGetters } from "vuex"

export default {
  props: ['issue'],
  computed: {
    ...mapGetters("github", { githubUser: 'user' }),
  }
}
</script>
