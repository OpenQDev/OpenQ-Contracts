<template>
  <div v-if="issue">
    <div :class="'issue d-flex justify-content-between px-3 py-2 my-2 ' + (boostAmount > 0 ? 'border-left border-right border-primary' : '')">
      <div class="d-flex flex-column text-truncate">
        <div class="text-truncate">
          {{ issue.title }}{{ issue.title }}{{ issue.title }}
        </div>
        <div class="text-truncate">
          <a :href="'https://github.com/' + issue.owner + '/' + issue.repository + '/issues/' + issue.number" target="_blank">
            <small class="text-muted">
              <font-awesome-icon :icon="['fas', 'external-link-alt']" class="text-muted-light" />
              {{ issue.owner }}/{{ issue.repository }}/issues/{{ issue.number }}
            </small>
          </a>
        </div>
        <div class="text-wrap">
          <span :class="'mr-1 badge badge-pill' + (brightnessByColor(issue.primaryLanguage.color) < 180 ? ' text-white' : '')" :style="'background-color: ' + issue.primaryLanguage.color">
            {{ issue.primaryLanguage.name }}
          </span><span :class="'mr-1 badge badge-pill' + (brightnessByColor('#' + label.color) < 180 ? ' text-white' : '')" v-for="label in issue.labels" :style="'background-color: #' + label.color">
            {{ label.name }}
          </span>
        </div>
      </div>
      <div class="ml-2 pl-2 text-nowrap text-center d-flex flex-column">
        <h5 class="mb-0">{{ depositAmount.toFixed(2) }} <small>ETH</small></h5>
        <small>{{ boostAmount.toFixed(2) }} MERGE</small>
        <small class="text-muted">locked</small>
      </div>
    </div>
  </div>
  <div v-else class="d-flex justify-content-center p-4 m-3 rounded-lg">
    <font-awesome-icon :icon="['fas', 'circle-notch']" spin class="text-muted-light" />
  </div>
</template>

<style lang="sass">
.issue
  &:hover
    background: #f8f8f8
</style>

<script>
export default {
  props: ['issueId', 'depositAmount', 'boostAmount'],
  data() {
    return {
      issue: null
    }
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
        labels: data.data.node.labels.edges.map(label => label.node)
      }
    })
  }
}
</script>
