<template>
  <div>
    <div v-if="issue" :class="['issue d-flex flex-column px-3 py-2 mt-3', { 'border-left border-right border-primary': boostAmount > 0, showDetails }]" @click="showDetails = !showDetails">
      <div class="d-flex align-items-center">
        <div class="text-truncate">
          <div class="text-truncate">
            <svg v-if="issue.closed" height="16" viewBox="0 0 16 16" version="1.1" width="14" aria-hidden="true">
              <path fill="#c00" d="M1.5 8a6.5 6.5 0 0110.65-5.003.75.75 0 00.959-1.153 8 8 0 102.592 8.33.75.75 0 10-1.444-.407A6.5 6.5 0 011.5 8zM8 12a1 1 0 100-2 1 1 0 000 2zm0-8a.75.75 0 01.75.75v3.5a.75.75 0 11-1.5 0v-3.5A.75.75 0 018 4zm4.78 4.28l3-3a.75.75 0 00-1.06-1.06l-2.47 2.47-.97-.97a.749.749 0 10-1.06 1.06l1.5 1.5a.75.75 0 001.06 0z"></path>
            </svg>
            <svg v-else height="16" viewBox="0 0 16 16" version="1.1" width="14" aria-hidden="true">
              <path fill="#0a0" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z"></path>
            </svg>
            {{ issue.title }}{{ issue.title }}{{ issue.title }}
          </div>
          <small class="text-muted text-truncate">
            {{ issue.owner }}/{{ issue.repository }}/issues/{{ issue.number }}
          </small>
        </div>
        <div class="text-nowrap text-center ml-2">
          <h5 class="mb-0">{{ depositAmount.toFixed(2) }} <small>ETH</small></h5>
          <small class="d-block text-muted mt-1">
            <font-awesome-icon :icon="['fas', 'thumbtack']" class="text-muted-light" />
            {{ boostAmount.toFixed(2) }} MRG
          </small>
        </div>
      </div>
      <div>
        <span :class="'mr-1 badge badge-pill' + (brightnessByColor(issue.primaryLanguage.color) < 180 ? ' text-white' : '')" :style="'background-color: ' + issue.primaryLanguage.color">
          {{ issue.primaryLanguage.name }}
        </span><span :class="'mr-1 badge badge-pill' + (brightnessByColor('#' + label.color) < 180 ? ' text-white' : '')" v-for="label in issue.labels" :style="'background-color: #' + label.color">
          {{ label.name }}
        </span>
      </div>
      <div class="d-flex mt-2 justify-content-end align-items-center details">
        <div class="border-top w-100 pt-2 text-nowrap">
          <button class="btn btn-sm my-auto ml-1 btn-light" @click.stop>
            Deposit
          </button>
          <button class="btn btn-sm my-auto ml-1 btn-light" @click.stop v-if="issue.owner === githubUser.login">
            Release
          </button>
          <button class="btn btn-sm my-auto ml-1 btn-light" @click.stop v-if="issue.owner !== githubUser.login">
            Withdraw
          </button>
          <button class="btn btn-sm my-auto ml-1 btn-light" @click.stop>
            <font-awesome-icon :icon="['fas', 'thumbtack']" />
            Pin
          </button>
          <a class="btn btn-sm my-auto ml-1 btn-light" @click.stop :href="'https://github.com/' + issue.owner + '/' + issue.repository + '/issues/' + issue.number" target="_blank">
            <font-awesome-icon :icon="['fab', 'github']" />
            <font-awesome-icon :icon="['fas', 'external-link-alt']" class="text-muted-light ml-1" />
          </a>
        </div>
      </div>
    </div>
    <div v-else-if="!issue" class="d-flex justify-content-center p-4 m-3 rounded-lg">
      <font-awesome-icon :icon="['fas', 'circle-notch']" spin class="text-muted-light" />
    </div>
  </div>
</template>

<style lang="sass">
.issue
  border-width: 2px !important
  cursor: pointer
  &:hover
    background: #f8f8f8
  .details
    overflow: hidden
    max-height: 0
    transition: max-height .3s ease
  &.showDetails
    background: #f8f8f8
    .details
      max-height: 40px
</style>

<script>
import { mapGetters } from "vuex"

export default {
  props: ['issueId', 'depositAmount', 'boostAmount'],
  data() {
    return {
      issue: null,
      showDetails: false
    }
  },
  computed: {
    ...mapGetters('github', { githubUser: 'user' })
  },
  methods: {
    brightnessByColor(color) {
      var color = "" + color, isHEX = color.indexOf("#") == 0, isRGB = color.indexOf("rgb") == 0;
      if (isHEX) {
        const hasFullSpec = color.length == 7;
        var m = color.substr(1).match(hasFullSpec ? /(\S{2})/g : /(\S{1})/g);
        if (m) var r = parseInt(m[0] + (hasFullSpec ? '' : m[0]), 16), g = parseInt(m[1] + (hasFullSpec ? '' : m[1]), 16), b = parseInt(m[2] + (hasFullSpec ? '' : m[2]), 16);
      }
      if (isRGB) {
        var m = color.match(/(\d+){3}/g);
        if (m) var r = m[0], g = m[1], b = m[2];
      }
      if (typeof r != "undefined") return ((r*299)+(g*587)+(b*114))/1000;
    }
  },
  mounted() {
    this.$axios.$post(
      "https://api.github.com/graphql",
      {
        query: `query {
  node(id:"${this.issueId}") {
    ... on Issue {
      title,
      number,
      closed,
      labels(first: 100) {
      	edges {
        	node {
          	name,
            color
        	}
      	}
    	},
      repository {
        name,
        primaryLanguage {
          name,
          color
        },
        owner {
          login
        }
      }
    }
  }
}`
      },
      {
        headers: {
          Authorization: "bearer " + process.env.GITHUB_APP_ACCESS_TOKEN
        }
      }
    )
    .then(data => {
      this.issue = {
        number: data.data.node.number,
        title: data.data.node.title,
        owner: data.data.node.repository.owner.login,
        repository: data.data.node.repository.name,
        primaryLanguage: data.data.node.repository.primaryLanguage,
        labels: data.data.node.labels.edges.map(label => label.node),
        closed: data.data.node.closed
      }
    })
  }
}
</script>
