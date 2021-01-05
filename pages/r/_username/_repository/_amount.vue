<script>
export default {
  middleware({ store, route, redirect }) {
    store.commit('setRedirectPrefills', {
      type: 'send-repository',
      username: route.params.username,
      repository: route.params.repository,
      amount: Number(route.params.amount)
    })
    return redirect('/')
  }
}
</script>
