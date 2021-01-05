<template>
  <div class="embed border rounded-xl px-2 pb-3 mb-2" style="margin-top: -56px; padding-top: 56px; border-color: #f2f2f2 !important">
    <div class="d-flex justify-content-between">
      <a :href="repository.url" target="_blank" class="text-truncate text-dark" :title="repository.name">
        <b>{{ repository.owner.login }}/{{ repository.name }}</b>
      </a>
      <small class="text-muted">
        <span v-tooltip="{ content: 'Forks', trigger: 'hover' }" class="mr-1">
          <font-awesome-icon :icon="['fas', 'code-branch']" />
          {{ repository.forkCount }}
        </span>
        <span v-tooltip="{ content: 'Likes', trigger: 'hover' }" class="mr-1">
          <font-awesome-icon :icon="['fas', 'star']" />
          {{ repository.stargazerCount }}
        </span>
        <span v-tooltip="{ content: 'Collaborators', trigger: 'hover' }">
          <font-awesome-icon :icon="['fas', 'users']" />
          {{ repository.collaborators.totalCount }}
        </span>
      </small>
    </div>
    <small class="mt-1 d-flex justify-content-between">
      <div>
        <div v-if="repository.primaryLanguage">
          <span :class="'mr-1 badge badge-pill' + (brightnessByColor(repository.primaryLanguage.color) < 180 ? ' text-white' : '')" :style="'background-color: ' + repository.primaryLanguage.color">
            {{ repository.primaryLanguage.name }}
          </span>
        </div>
      </div>
      <div class="text-muted">
        created
        {{ repository.createdAt | moment("MMM Do YYYY") }}
        <span class="text-dark">by</span>
        <a :href="repository.owner.url" target="_blank" class="text-muted">
          <b>{{ githubUser && githubUser.login === repository.owner.login ? 'you' : repository.owner.login }}</b>
        </a>
      </div>
    </small>
  </div>
</template>

<script>
import { mapGetters } from "vuex"
import helpers from '@/mixins/helpers'

export default {
  props: ['repository'],
  mixins: [helpers],
  computed: {
    ...mapGetters("github", { githubUser: 'user' }),
  }
}
</script>
