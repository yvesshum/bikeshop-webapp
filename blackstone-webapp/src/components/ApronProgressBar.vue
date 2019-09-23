<template>
  <div class="apron_progress_bar">
    <ApronImg 
      v-for="(apron, n) in colors" style="display:inline-block;"
      :color="apron.color" :size="size" :active="apron_active(n)" :name="apron_name(n)"
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
      type: [Number, String],
      default: -1,
      validator: val => {
        if (typeof val == "string") {
          return val == "all";
        } else {
          return val >= -1;
        }
      }
    },
  },

  data: function() {
    return {
      hover: {},
    };
  },

  methods: {
    apron_active: function(n) {
      if (this.level != null) {
        if (typeof this.level == "string") {
          return this.level == "all";
        } else {
          return n <= this.level;
        }
      }
      return false;
    },

    apron_name: function(n) {
      return this.colors[n].name;
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
    cursor: pointer;
  }
</style>