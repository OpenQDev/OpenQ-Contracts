<script>
export default {
  middleware({ store, route, redirect }) {
    store.commit('setRedirectPrefills', {
      type: 'send-issue',
      username: route.params.username,
      repository: route.params.repository,
      issue: route.params.issue,
      amount: Number(route.params.amount)
    })
    return redirect('/')
  }
}
</script>
