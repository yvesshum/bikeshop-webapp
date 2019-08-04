<template>
  <div>
    CHECKIN PAGE
  </div>
</template>

<script>
import plugin from '@/plugin.js'
import Vue from 'vue'
Vue.use(plugin, {})
export default {
  data() {
    return {

    }
  },
  methods: {

  },
  mounted() {
    console.log(this.$plugin_test())
  }
}
</script>
