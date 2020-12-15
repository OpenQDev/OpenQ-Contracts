<template>
  <div class="embed rounded-bottom pt-3 pb-2 px-2 mb-2">
    <div class="d-flex">
      <span :class="'d-flex align-items-center badge badge-pill pl-1 mr-1 badge-' + (contribution.closed ? 'danger' : 'success')">
        <InfoIcon width="16px" height="16px" class="mr-1" />
        {{ contribution.closed ? 'closed' : 'open' }}
      </span>
      <a :href="contribution.url" target="_blank" class="text-truncate text-dark" :title="contribution.title">
        <b>{{ contribution.title }}></b>
      </a>
      <span class="text-muted ml-1">#{{ contribution.number }}</span>
    </div>
    <small class="d-flex justify-content-between text-muted mt-1">
      <span>
        {{ contribution.created_at | moment("MMMM Do YYYY") }}
        <span class="text-dark">by</span>
        <a :href="contribution.author.url" target="_blank" class="text-muted">
          <b>{{ githubUser && githubUser.login === contribution.author.login ? 'you' : contribution.author.login }}</b>
        </a>
      </span>
      <span>
        <font-awesome-icon :icon="['far', 'comment-alt']" />
        {{ contribution.comments.totalCount }}
      </span>
    </small>
  </div>
</template>

<script>
import { mapGetters } from "vuex"

export default {
  props: ['contribution'],
  computed: {
    ...mapGetters("github", { githubUser: 'user' }),
  }
}
</script>
