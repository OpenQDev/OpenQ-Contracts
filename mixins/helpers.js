export default {
  methods: {
    getAge(createdAt) {
      return (new Date().getTime() - new Date(createdAt).getTime()) / (60 * 60 * 24 * 1000)
    }
  }
}
