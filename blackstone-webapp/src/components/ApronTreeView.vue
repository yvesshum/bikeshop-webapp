<template>
  <div class="apron_tree_view">

    <div class="tree-container">

      <div v-for="box in tree_boxes" :class="get_box_class(box)" :style="get_box_style(box)">

        <b-card v-if="box.type == 'apron'" class="tree-apron-content">
          <ApronImg :color="get_color_val(box.apron)" :size="72" />
          <br />
          <span style="font-size: 24px">{{box.apron}} Apron</span>
          <br />
          <span>{{box.num_achieved}} / {{box.num_total}} Achieved</span>
          <b-progress :value="box.num_achieved" :max="box.num_total" animated
            :variant="box.num_achieved == box.num_total ? 'success' : 'primary'"
          ></b-progress>
        </b-card>

        <b-card v-else-if="box.type == 'category'" class="tree-category-content" no-body>
          <b-card-body style="padding:5px">
            <span style="font-size: 24px">{{box.category}}</span>
            <br />
            <span>{{box.num_achieved}} / {{box.num_total}} Achieved</span>
            <b-progress :value="box.num_achieved" :max="box.num_total" animated
              :variant="box.num_achieved == box.num_total ? 'success' : 'primary'"
            ></b-progress>
          </b-card-body>
        </b-card>

        <b-list-group v-else-if="box.type == 'skills'" class="tree-skills-content">
          <b-list-group-item v-for="skill in box.skills" :variant="skill.achieved ? 'success' : 'light'"><span style="margin-right:1em;">{{skill.achieved ? "&#9745;" : "&#9744;"}}</span>{{skill.skill}}</b-list-group-item>
        </b-list-group>

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

let ApronColorsRef = db.collection("GlobalVariables").doc("Apron Colors");
let ApronSkillsRef = db.collection("GlobalVariables").doc("Apron Skills");

export default {
  name: 'apron_tree_view',

  components: {
    ApronImg,
  },

  props: {
    loadApronSkills: {
      type: Boolean,
      default: true,
    },

    apronSkills: {
      type: Object,
      default: null,
    },

    loadApronColors: {
      type: Boolean,
      default: true,
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
      loaded_apron_skills: [],
      loaded_apron_colors: [],

      selected_color: "",
    };
  },

  created: async function() {
    this.$emit("load_start");
    await this.ensure_data_loaded();
    this.$emit("load_complete", this);

    console.log(this.tree_boxes);
  },

  computed: {

    /* The object containing the apron skills
     *
     * Depending on the loadApronColors prop, this will either be passed in as a prop
     * or loaded from the database
     */
    apron_skills: function() {
      if (this.loadApronInfo == true && this.apronSkills == null) {
        return this.loaded_apron_skills;
      } else {
        return this.apronSkills;
      }
    },

    /* The list of apron colors
     *
     * Depending on the loadApronColors prop, this will either be passed in as a prop
     * or loaded from the database
     */
    apron_colors: function() {
      if (this.loadApronInfo == true && this.apronColors == null) {
        return this.loaded_apron_colors;
      } else {
        return this.apronColors;
      }
    },

    tree_boxes: function() {
      if (this.apron_skills == null || this.achievedSkills == null) return [];

      let result = [];
      Object.keys(this.apron_skills).forEach(apron => {
        let span = Object.keys(this.apron_skills[apron]).length;

        // Initialize the apron tile and push it into the list before the categories & skills
        var apron_object = { type: "apron", apron, span };
        result.push(apron_object);

        var total = 0;
        var achieved = 0;

        Object.keys(this.apron_skills[apron]).forEach((category, n) => {

          var tot_list = this.apron_skills[apron][category];
          var ach_list = this.get_achieved_skills_list(apron, category);

          total    += tot_list.length;
          achieved += ach_list.length;

          // Create the category tile
          result.push({
            type: "category",
            apron, category,
            top: n == 0,
            bottom: n == span - 1,
            num_achieved: ach_list.length,
            num_total:    tot_list.length,
          });

          // Create the skills list tile
          result.push({
            type: "skills",
            apron, category,
            skills: tot_list.map(skill => {return {skill, achieved: ach_list.includes(skill)};}),
            top: n == 0,
            bottom: n == span - 1,
          });
        });

        // Update the apron tile with the properties that were computed running through each category in the forEach loop
        apron_object.num_total    = total;
        apron_object.num_achieved = achieved;
      });

      console.log(result);
      return result;
    },
  },

  watch: {

  },

  methods: {
    ensure_data_loaded: async function() {
      // Load skills, if requested
      if (this.loadApronSkills == true && this.apronSkills == null) {
        await this.load_apron_skills();
      }

      // Load colors, if requested
      if (this.loadApronColors == true && this.apronColors == null) {
        await this.load_apron_colors();
      }
    },

    // Load the apron skills object from the database and save it to this object
    load_apron_skills: async function() {
      var loaded_skills = await ApronSkillsRef.get();
      this.loaded_apron_skills = loaded_skills.data();
    },

    // Load the list of colors from the database and save it to this object
    load_apron_colors: async function() {
      var loaded_colors = await ApronColorsRef.get();
      this.loaded_apron_colors = loaded_colors.data()["Colors"];
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

    get_achieved_skills_list: function(apron, category) {
      console.log(this.achievedSkills);
      if ( this.achievedSkills == undefined
        || this.achievedSkills[apron] == undefined
        || this.achievedSkills[apron].Skills[category] == undefined
        ) {
        return []
      }
      return this.achievedSkills[apron].Skills[category];
    },

    accept_changes: function() {
      console.log("Changes should be accepted!");
    },

    discard_changes: function() {
      console.log("Changes should be discarded!");
    },
  }
}
</script>

<style scoped>

  .tree-container {
    display: grid;
    grid-template-columns: 20fr 24fr 48fr; /*repeat(3, max-content); minmax(min-content, 1fr));*/
    background-color: DodgerBlue;
    margin: 10px;
  }

  .tree-apron-container {
    margin: 10px 2px 10px 10px;
    padding: 5px;
    display:flex;
    flex-direction: column;
    justify-content: center;
  }

  .tree-apron-content {
    justify-content: center;
    height: 100%;
  }

  .tree-category-container {
    padding: 5px;
    margin-right: 2px;
    margin-top: 1px;
    margin-bottom: 1px;
    display:flex;
    flex-direction: column;
    justify-content: center;
  }

  .tree-category-content {
    justify-content: center;
    height: 100%;
  }

  .tree-skills-container {
    /*background-color: #f1f1f1;*/
    padding: 5px;
    margin-right: 10px;
    margin-top: 1px;
    margin-bottom: 1px;
    text-align: left;
    display:flex;
    flex-direction: column;
  }

  .tree-skills-content {
    display:flex;
    flex-direction: column;
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