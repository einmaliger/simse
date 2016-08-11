<template>
  <div id="app" class="container">
    <nav class="navbar">
      <a class="navbar-brand" href="#">Simse</a>
      <ul class="nav navbar-nav">
        <li class="nav-item"><a class="nav-link" href="#">Dashboard</a></li>
        <li class="nav-item"><a class="nav-link" href="#">Risks</a></li>
        <li class="nav-item"><a class="nav-link" href="#">Assets</a></li>
      </ul>
      <form class="form-inline pull-right">
        <input class="form-control" type="text" placeholder="Search ...">
        <button class="btn btn-outline-success" type="submit"><i class="fa fa-search" aria-hidden="true"></i></button>
      </form>
    </nav>

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
