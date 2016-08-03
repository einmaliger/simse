<template>
  <div class="hello">
    <img class="logo" src="../assets/logo.png">
    <p>
      Welcome to your Vue.js app!
    </p>
    <h1><i class="de flag"></i>{{ msg }}</h1>
  </div>
</template>

<script>
export default {
  data () {
    return {
      // note: changing this line won't causes changes
      // with hot-reload because the reloaded component
      // preserves its current state and we are modifying
      // its initial state.
      msg: 'Hello World, this is a test!'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1 {
  color: #42b983;
}
</style>
