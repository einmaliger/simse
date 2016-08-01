<template>
  <div class="ToggleBox">
    <img :src="checked?imgOn:imgOff" />
    {{label}}
  </div>
</template>

<script>
export default {
  props: {
    label: String,
    type: String,
    checked: Boolean
  },
  data () {
    return {
      imgOn: '',
      imgOff: ''
    }
  },
  computed: {
    isChecked () {
      return this.checked === undefined ? this.state : this.checked
    }
  },
  created () {
    if (this.type === 'check') {
      this.imgOn = '/static/box-checked.png'
      this.imgOff = '/static/box-unchecked.png'
    } else {
      this.imgOn = '/static/cross.png'
      this.imgOff = '/static/blank.png'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

img {
  width: 2em
}
</style>
