<script>
export default {
  middleware({ store, route, redirect }) {
    store.commit('setRedirectPrefills', {
      type: 'send-user',
      username: route.params.username,
      amount: Number(route.params.amount)
    })
    return redirect('/')
  }
}
</script>
