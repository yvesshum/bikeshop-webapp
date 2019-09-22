<template>
  <div class="apron_progress_bar">
    <ApronImg 
      v-for="(apron, n) in colors" style="display:inline-block;"
      :color="apron.color" :size="size" :active="apron_active(n)"
      @mousehover="t => mouse_hover(n, t)" :class="{hovered: hover[n]}"
      @click="val => mouse_click(n, val)"
    />
  </div>
</template>

<script>
// @ is an alias to /src
import ApronImg from '@/components/ApronImg';

export default {
  name: 'apron_progress_bar',

  components: {ApronImg},

  props: {
    colors: {
      type: Array,
      // validator: function(arr) {
      //   return arr.reduce((acc, curr) => acc && )
      // },
    },
    size: {
      type: Number,
      default: 32,
      validator: num => num > 0,
    },
    level: {
      type: Number,
      default: -1,
    },
  },

  data: function() {
    return {
      hover: {},
    };
  },

  computed: {
    apron_color: function() {
      if (this.level != null && this.level != -1) {
        return this.colors[this.level].name;
      }
      else {
        return "";
      };
    },
  },

  methods: {
    apron_active: function(n) {
      return (this.level !== null && n <= this.level);
    },

    mouse_hover: function(n, h) {
      this.$set(this.hover, n, h ? true : undefined);
    },

    mouse_click: function(n, active) {
      this.$emit("click", {level: n, active});
    },
  },
}
</script>

<style scoped>
  .hovered {
    filter: brightness(75%);
  }
</style>