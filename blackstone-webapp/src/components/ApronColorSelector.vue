<template>
  <div class="apron_color_selector">
    <b-dropdown class="apron_dropdown" :pressed="false">
        <template v-slot:button-content class="text-left" style="padding-right: 50px;">
          <ApronImg 
            class="apron_img_style"
            :color="selected.color" :size="size" :active="true" :name="selected.name"
            :showStatus="false"
          />
          {{selected.name}}
        </template>
        <b-dropdown-item v-for="(apron, n) in colors" class="text-left" @click="val => mouse_click(n, val)" style="width: 240px;">
          <ApronImg v-if="!(hideGray && apron.name == 'Gray')"
            class="apron_img_style"
            :color="apron.color" :size="size" :active="true" :name="apron_name(n)"
            :showStatus="false"
          />
          <b v-if="apron_name(n) == selected.name">{{apron_name(n)}}</b>
          <span v-else>{{apron_name(n)}}</span>
        </b-dropdown-item>
    </b-dropdown>
  </div>
</template>

<script>
import {db} from '@/firebase';
import {firebase} from '@/firebase';
import firebase_app from 'firebase/app';
import firebase_auth from 'firebase/auth';
import ApronImg from '@/components/ApronImg';


let ApronColorsRef = db.collection("GlobalVariables").doc("Apron Colors");

export default {
  name: 'apron_color_selector',

  components: {ApronImg},

  props: {
    selected: Object,
    hideGray: {
      type : Boolean,
      default : false
    },
    size: {
      type: Number,
      default: 20,
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
      colors : [],
    };
  },
  
  methods: {
    apron_name: function(n) {
      return this.colors[n].name;
    },

    mouse_hover: function(n, h) {
      if (this.hover[n] != "click") {
        this.$set(this.hover, n, h ? "hover" : undefined);
      }
      this.$emit("hover", this.hover);
    },

    mouse_click: function(n, active) {
      let curr = this.hover[n];
      this.$set(this.hover, n, (curr == undefined || curr == "hover") ? "click" : "hover");
      this.$emit("input", this.colors[n]);
      this.$emit("hover", this.hover);
    },
    
    async getColors() {
      let f = await ApronColorsRef.get();
      return f.data()["Colors"];
    },
  },
  async mounted() {
    this.colors = await this.getColors();
  }
}
</script>

<style scoped>
  .hovered {
    filter: brightness(75%);
    cursor: pointer;
  }
  
  .apron_img_style {
    display:inline-block;
    vertical-align: middle; 
    margin-right: 5px;
  }
  
  .apron_dropdown  {
    width: 240px;
  }
  
  .apron_dropdown /deep/ > button {
    background: none !important;
    outline: none !important;
    box-shadow: none !important;
    color: black !important;
    text-align: left !important;
  }
  
  .apron_dropdown /deep/ > .dropdown-toggle::after {
    position: absolute;
    left: 87%;
    top: 42%;
  }

</style>


