<template>
  <div id="app" class="ui container">
    <div class="ui top menu">
      <a class="item">Dashboard</a>
      <a class="item">Risks</a>
      <a class="item">Assets</a>
      <div class="right item">
        <div class="ui icon input">
          <input placeholder="Search ..." type="text">
          <i class="search icon"></i>
        </div>
      </div>
      <a class="item">Login <i class="user icon"></i></a>
    </div>

    <router-view></router-view>
  </div>
</template>

<script>
export default {
}
</script>

<style>
html {
  height: 100%;
}

body {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

#app {
  text-align: center;
}

#app a {
  color: #42b983;
  text-decoration: none;
}

.logo {
  width: 100px;
  height: 100px
}
</style>
