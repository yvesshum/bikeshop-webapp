<template>
  <div class="apron_tree_view">

    <div class="tree-container">

      <div v-for="box in tree_boxes" :class="get_box_class(box)" :style="get_box_style(box)">
        <div v-if="box.type == 'apron'" class="tree-apron-content">
          <ApronImg :color="get_color_val(box.apron)" :size="48" />
          <br />
          <span style="font-size: 24px">{{box.apron}} Apron</span>
          <br />
          <span>{{box.num_achieved}} / {{box.num_total}} Achieved</span>
        </div>
        <div v-else-if="box.type == 'category'" class="tree-category-content">
          <span style="font-size: 24px">{{box.category}}</span>
          <br />
          <span>{{box.num_achieved}} / {{box.num_total}} Achieved</span>
        </div>
        <div v-else-if="box.type == 'skills'" class="tree-skills-content">
          <ul>
            <li v-for="skill in box.skills">{{skill}}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- <div class="flex-container">
      <div class="apron-open">
        <div class="flex-inner-inner" style="text-align: center;">
          <br />
          <ApronImg :color="140" :size="48" />
          <br />
          <span>Green Apron</span>
          <br />
          <span>1 / 4</span>
        </div>
        <div style="display: flex; flex-direction: column">
          <div style="display: flex; flex-direction: row">
            <div class="flex-inner-inner" style="font-size: 24px; width: 150px;">
              Advocacy/Safety
              <br />
              <span style="font-size: 18px;">0 / 2</span>
            </div>
            <div class="flex-inner-inner">
              <ul>
                <li>Can size + wear helmet correctly</li>
                <li>Understands ABC Check</li>
              </ul>
            </div>
          </div>
          <div style="display: flex; flex-direction: row">
            <div class="flex-inner-inner" style="font-size: 24px; width: 150px;">
              Cycling
            </div>
            <div class="flex-inner-inner">
              <ul>
                <li>Can ride a bike to the best of your ability</li>
                <li>Understands safe group riding practices</li>
              </ul>
            </div>
          </div>
          <div style="display: flex; flex-direction: row">
            <div class="flex-inner-inner" style="font-size: 18px; width: 150px;">
              Mechanics
            </div>
          </div>
        </div>
      </div>
      <div class="apron-locked">
        <div class="flex-inner-inner">
          <ApronImg :color="0" :size="36" :active="false" />
        </div>
        <div class="flex-inner-inner">Locked</div>
      </div>
      <div class="apron-locked">
        <div class="flex-inner-inner">
          <ApronImg :color="270" :size="36" :active="false" />
        </div>
        <div class="flex-inner-inner">Locked</div>
      </div>
      <div class="apron-locked">
        <div class="flex-inner-inner">
          <ApronImg :color="361" :size="36" :active="false" />
        </div>
        <div class="flex-inner-inner">Locked</div>
      </div>
    </div> -->

  </div>
</template>

<script>
// @ is an alias to /src
import {db} from '@/firebase';
import {firebase} from '@/firebase';
import firebase_app from 'firebase/app';
import firebase_auth from 'firebase/auth';
import ApronImg from '@/components/ApronImg';

export default {
  name: 'apron_tree_view',

  components: {
    ApronImg,
  },

  props: {
    loadApronInfo: {
      type: Boolean,
      default: true,
    },

    apronSkills: {
      type: Object,
      default: null,
    },

    apronColors: {
      type: Array,
      default: [],
    },

    achievedSkills: {
      type: Object,
      default: null,
    },

    achievedColor: {
      type: String,
      default: "",
    },
  },

  data: function() {
    return {
      loaded_apron_info: null,
      loaded_apron_skills: [],
      loaded_apron_colors: [],

      selected_color: "",
    };
  },

  created: async function() {
    this.$emit("load_start");
    await this.ensure_data_loaded();
    this.$emit("load_complete");

    console.log(this.tree_boxes);
  },

  computed: {

    apron_skills: function() {
      if (this.loadApronInfo == true && this.apronSkills == null) {
        return this.loaded_apron_skills;
      } else {
        return this.apronSkills;
      }
    },

    apron_colors: function() {
      if (this.loadApronInfo == true && this.apronColors == null) {
        return this.loaded_apron_colors;
      } else {
        return this.apronColors;
      }
    },

    tree_boxes: function() {
      if (this.apron_skills == null) return [];

      let result = [];
      Object.keys(this.apron_skills).forEach(apron => {
        let span = Object.keys(this.apron_skills[apron]).length;
        result.push({
          type: "apron",
          apron,
          span,
          num_achieved: 0,
          num_total: 8,
        });
        Object.keys(this.apron_skills[apron]).forEach((category, n) => {
          result.push({
            type: "category",
            apron, category,
            top: n == 0,
            bottom: n == span - 1,
            num_achieved: 0,
            num_total: 2,
          });
          result.push({
            type: "skills",
            apron, category,
            skills: this.apron_skills[apron][category],
            top: n == 0,
            bottom: n == span - 1,
          });
        });
      });

      console.log(result);
      return result;
    },
  },

  watch: {

  },

  methods: {
    ensure_data_loaded: async function() {

      // Load apron info, if requested based on props
      if (this.loadApronInfo == true && this.apronInfo == null) {
        await this.load_apron_info();
      }
    },

    // Load the master copy of apron information
    load_apron_info: async function() {

      console.log("Loading data from Firebase...");

      //  Retrieve the Apron information from the database
      var snapshot = db.collection("ApronSkills").doc("Test Doc");
      this.loaded_apron_info = await snapshot.get();

      // Get the lists of skills and colors
      this.loaded_apron_skills = this.loaded_apron_info.data()["Skills"];
      this.loaded_apron_colors = this.loaded_apron_info.data()["Colors"];
    },

    // Apply a function to each skill, along with its color, group, and value
    map_apron_obj: function(obj, f) {
      if (obj == null) return;
      Object.keys(obj).forEach(color => {

        if (obj[color] == null) return;
        Object.keys(obj[color]).forEach(group => {

          if (obj[color][group] == null) return;
          for (let x in obj[color][group]) {
            f(color, group, x, obj[color][group][x]);
          }
        });
      });
    },

    apron_active: function(n) {
      return (this.apron_level !== null && n <= this.apron_level);
    },

    // get_apron_property: function(level, prop) {
    //   if (this.apron_colors == null || this.apron_colors[level] == null) return "";
    //   return this.apron_colors[level][prop];
    // },

    get_apron_property: function(color, field, fallback) {
      for (var i = 0; i < this.apron_colors.length; i++) {
        if (this.apron_colors[i].name == color) {
          return this.apron_colors[i][field]
        }
      }
      return fallback;
      // if (this.apron_colors == null || this.apron_colors[level] == null) return "";
      // return this.apron_colors[level][prop];
    },    

    get_color: function(color) {
      return {
        value:     this.get_apron_property(color, 'value',     null),
        grayscale: this.get_apron_property(color, 'grayscale', null),
      };
    },

    get_color_val: function(color) {
      let val = this.get_apron_property(color, 'value', null);
      // console.log(val);
      // return this.apron_colors[color].value
      return val;
      // return this.get_apron_property(color, 'value');
    },

    get_box_class: function(box) {
      let top    = box.top    ? "tree-content-top"    : "";
      let bottom = box.bottom ? "tree-content-bottom" : "";
      switch(box.type) {
        case "apron":
          return "tree-apron-container tree-content-top tree-content-bottom";
        case "category":
          return `tree-category-container ${top} ${bottom}`;
        case "skills":
          return `tree-skills-container ${top} ${bottom}`;
        default:
          return "";
      };
    },

    get_box_style: function(box) {
      if (box.type == "apron") {
        return `grid-row: span ${box.span};`;
      }
      else {
        return "";
      }
    },
  }
}
</script>

<style scoped>

  .tree-container {
    display: grid;
    grid-template-columns: 1fr 1fr 3fr; /*repeat(3, max-content); minmax(min-content, 1fr));*/
    background-color: DodgerBlue;
    margin: 10px;
  }

  .tree-apron-container {
    background-color: #f1f1f1;
    margin: 10px 2px 10px 10px;
    padding: 5px;
    display:flex;
    flex-direction: column;
    justify-content: center;
  }

  .tree-apron-content {

  }

  .tree-category-container {
    background-color: #f1f1f1;
    padding: 5px;
    margin-right: 2px;
    margin-top: 1px;
    margin-bottom: 1px;
    display:flex;
    flex-direction: column;
    justify-content: center;
  }

  .tree-category-content {

  }

  .tree-skills-container {
    background-color: #f1f1f1;
    padding: 5px;
    margin-right: 10px;
    margin-top: 1px;
    margin-bottom: 1px;
    text-align: left;
    display:flex;
    flex-direction: column;
    justify-content: center;
  }

  .tree-skills-content {
    display:flex;
    flex-direction: column;
    justify-content: center;
  }

  .tree-content-top {
    margin-top: 10px;
  }

  .tree-content-bottom {
    margin-bottom: 10px;
  }






  .flex-container {
    display: flex;
    flex-direction: column;
    background-color: DodgerBlue;
    text-align: center;
  }

  .apron-open {
    display: flex;
    flex-direction: row;
    background-color: #f1f1f1;
    margin: 10px;
    align-items: center;
  }

  .apron-closed {
    display: flex;
    flex-direction: row;
    background-color: #f1f1f1;
    margin: 10px;
    align-items: center;
    /*justify-content: center;*/
  }

  .apron-locked {
    display: flex;
    flex-direction: row;
    background-color: #dbdbdb;
    margin: 10px;
    align-items: center;
    /*justify-content: center;*/
  }

  .flex-inner {
    display: flex;
    flex-direction: row;
    background-color: #f1f1f1;
    margin: 10px;
    align-items: center;
  }

  .flex-inner-inner {
    /*background-color: white;*/
    margin: 5px;
    padding: 2px;
    text-align: center;
    /*line-height: 75px;*/
    /*font-size: 30px;*/
  }

</style>