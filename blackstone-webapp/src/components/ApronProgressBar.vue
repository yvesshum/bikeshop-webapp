<template>
  <div class="apron_progress_bar">
    <ApronImg 
      v-for="(apron, n) in colors" style="display:inline-block;"
      :color="apron.color" :size="size" :name="apron_name(n)"
      :status="apron_status(n)"
      :showName="showName" :showStatus="showStatus"
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

    selectType: {
      type: String,
      default: "none",
      validator: val => {
        return ["none", "select_single", "toggle_single", "toggle_multiple"]
      }
    },

    value: {
      type: [String, Array],
      default: null,
    },

    showName:   { type: Boolean, default: true, },
    showStatus: { type: Boolean, default: true, },
  },

  data: function() {
    return {
      hover: {},
    };
  },

  methods: {
    apron_status: function(n) {
      if (this.level != null) {
        if (typeof this.level == "string") {
          return this.level == "all" ? "achieved" : "locked";
        } else {
          if (n < this.level) {
            return "achieved";
          }
          else if (n == this.level) {
            return "working";
          }
          return "locked";
        }
      }
      return undefined;
    },

    apron_name: function(n) {
      return this.colors[n].name;
    },

    mouse_hover: function(n, h) {
      if (this.hover[n] != "click") {
        this.$set(this.hover, n, h ? "hover" : undefined);
      }
      this.$emit("hover", this.hover);
    },

    mouse_click: function(n, status) {
      let curr = this.hover[n];

      switch (this.selectType) {

        // Don't allow any selection
        case "none":
          break;

        // When an apron is clicked, switch to its color, regardless of previous value
        // If a "no color" value isn't possible
        case "select_single":
          this.hover = {};
          this.$set(this.hover, n, "click");
          this.$emit("input", this.apron_name(n));
          break;

        // When an apron is clicked, toggle to it
        case "toggle_single":

          // If clicked apron is selected, switch it back to hover
          if (curr == "click") {
            this.$set(this.hover, n, "hover");
            this.$emit("input", null);
          }

          // If clicked apron is not selected, remove all other selections and select it
          else {
            this.hover = {};
            this.$set(this.hover, n, "click");
            this.$emit("input", this.apron_name(n));
          }

          break;

        case "toggle_multiple":
          // Toggle the clicked apron
          this.$set(this.hover, n, (curr == undefined || curr == "hover") ? "click" : "hover");
          this.$emit("input",
            Object.keys(this.hover).filter(key => this.hover[key] == "click").map(this.apron_name)
          );
          break;

        default:
        break;

      }

      this.$emit("hover", this.hover);
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