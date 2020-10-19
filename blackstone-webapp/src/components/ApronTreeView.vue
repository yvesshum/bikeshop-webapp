<template>
  <div class="apron_tree_view">

    <b-card no-body bg-variant="light">

      <!-- Header -->
      <b-card-header>
        <slot name="header"></slot>
      </b-card-header>

      <b-card-body style="display: flex; align-content:center;">
        <b-card no-body border-variant="light" bg-variant="light">

          <b-tabs v-model="selected_tab"
            vertical pills
            nav-wrapper-class="w-25"
            active-nav-item-class="font-weight-bold"
            @changed="changed_tabs"
          >
            <b-tab v-for="(section, n) in tree_tabs"
              :title-link-class="get_apron_tab_class(section, n)"
            >

              <template v-slot:title>
                <b-card no-body :border-variant="selected_tab == n ? 'light' : ''">

                  <b-card-body class="tree-card-body-centered" style="width: 100%;">
                    <div style="flex: 0 0 25%;">
                      <ApronImg
                        :color="get_color_val(section.apron.apron)"
                        :size="48"
                        :status="get_apron_img_status(section)"
                      />
                    </div>
                    <div style="flex: 1;">
                      <span style="font-size: 22px">{{section.apron.apron}} Apron</span>
                      <b-progress v-if="!section_locked(section)" :max="section.apron.num_total">
                        <b-progress-bar :value="section.apron.num_achieved - section.apron.num_rem" animated :variant="get_apron_progress_variant(section)">
                          <span v-if="section.apron.num_achieved > 0">{{section.apron.num_achieved}} / {{section.apron.num_total}}</span>
                        </b-progress-bar>
                        <b-progress-bar :value="section.apron.num_add" animated variant="warning">
                          <span v-if="section.apron.num_add > 0">+{{section.apron.num_add}}</span>
                        </b-progress-bar>
                        <b-progress-bar :value="section.apron.num_rem" animated variant="danger">
                          <span v-if="section.apron.num_rem > 0">-{{section.apron.num_rem}}</span>
                        </b-progress-bar>
                      </b-progress>
                      <span>{{get_earned_msg(section.apron)}}</span>
                    </div>
                  </b-card-body>

                </b-card>
              </template>

              <b-card style="display: grid; grid-template-columns: 1fr 2fr;" no-body>
                <div v-for="box in section.content" :class="get_box_class(box)" :style="get_box_style(box)">

                  <b-card v-if="box.type == 'category'" class="tree-category-content" no-body>
                    <b-card-body class="tree-card-body-centered">
                      <div style="width: 100%;">
                        <span style="font-size: 24px">{{box.category}}</span>
                        <div v-if="!section_locked(section)">
                          <span>{{box.num_achieved}} / {{box.num_total}} Achieved</span>
                          <b-progress :max="box.num_total">
                            <b-progress-bar :value="box.num_achieved - box.num_rem" animated :variant="box.num_achieved - box.num_rem + box.num_add == box.num_total ? 'success' : 'primary'">
                            </b-progress-bar>
                            <b-progress-bar :value="box.num_add" animated variant="warning">
                            </b-progress-bar>
                            <b-progress-bar :value="box.num_rem" animated variant="danger">
                            </b-progress-bar>
                          </b-progress>
                        </div>
                      </div>
                    </b-card-body>
                  </b-card>

                  <b-list-group v-else-if="box.type == 'skills'" class="tree-skills-content">
                    <b-list-group-item v-for="skill in box.skills"
                      :variant="list_item_variant(box, skill)"
                      @click="toggle_skill(box, skill)"
                      :style="{cursor: allow_edits ? 'pointer' : undefined}"
                    >
                      <span style="margin-right:1em;">{{skill.achieved ? "&#9745;" : "&#9744;"}}</span>{{skill.skill}}
                    </b-list-group-item>
                  </b-list-group>

                </div>
              </b-card>

            </b-tab>

            <template v-slot:tabs-start v-if="allow_edits">
              <b>Show Apron Skills</b>
            </template>

            <template v-slot:tabs-end v-if="allow_edits">
              <br />
              <b>Change Apron Level</b>
              <slot name="increment_buttons"></slot>
            </template>
          </b-tabs>
        </b-card>
      </b-card-body>

      <b-card-footer v-show="allow_edits">
        <div style="float:left; margin: 5px;">
          <i>Click on a skill to add or remove it from the youth's profile.</i>
        </div>
        <div style="float:right">
          <slot name="save_buttons"></slot>
        </div>
      </b-card-footer>
    </b-card>

  </div>
</template>

<script>
// @ is an alias to /src
import {db} from '@/firebase';
import {firebase} from '@/firebase';
import firebase_app from 'firebase/app';
import firebase_auth from 'firebase/auth';
import ApronImg from '@/components/ApronImg';

import {Status} from '@/scripts/Status.js';

let ApronColorsRef = db.collection("GlobalVariables").doc("Apron Colors");
let ApronSkillsRef = db.collection("GlobalVariables").doc("Apron Skills");

export default {
  name: 'apron_tree_view',

  components: {
    ApronImg,
  },

  props: {
    allowEdits: {
      type: Boolean,
      default: false,
    },

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

    currentColor: {
      type: String,
      default: "",
    },

    showColor: {
      type: String,
      default: null,
    },

    statusObj: {
      type: Object,
    },
  },

  data: function() {
    return {
      loaded_apron_skills: [],
      loaded_apron_colors: [],

      selected_tab: 0,
    };
  },

  created: async function() {
    this.$emit("load_start");
    await this.ensure_data_loaded();
    this.$emit("load_complete", this);
  },

  computed: {

    /* The object containing the apron skills
     *
     * Depending on the loadApronColors prop, this will either be passed in as a prop
     * or loaded from the database
     */
    apron_skills: function() {
      if (this.apron_colors.length < 1) return;

      var temp;
      if (this.loadApronInfo == true && this.apronSkills == null) {
        temp = this.loaded_apron_skills;
      } else {
        temp = this.apronSkills;
      }

      // Invert the apron colors and categories
      return Object.keys(temp).reduce((acc, category) => {
        this.apron_colors.forEach(({name}) => {
          if (temp[category][name].length > 0) {
            if (acc[name] == undefined) acc[name] = {};
            acc[name][category] = temp[category][name];
          }
        });
        return acc;
      }, {});
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

    tree_tabs: function() {
      if (this.apron_skills == null || this.achievedSkills == null) return [];

      let result = [];

      Object.keys(this.apron_skills).forEach(apron => {
        let span = Object.keys(this.apron_skills[apron]).length;
        let earned = this.achievedSkills[apron] == undefined ? false : this.achievedSkills[apron].Achieved;

        // Initialize an array to hold category & skill list boxes
        var content = [];

        // Variables to track the running totals of skills possible, achieved, added, and removed
        var total = 0;
        var achieved = 0;
        var num_add = 0;
        var num_rem = 0;

        Object.keys(this.apron_skills[apron]).forEach((category, n) => {

          var tot_list = this.apron_skills[apron][category];
          var ach_list = this.get_achieved_skills_list(apron, category);

          total    += tot_list.length;
          achieved += ach_list.length;

          // Calculate the number of skills in this category that the user wants to add
          var num_add_temp = tot_list.filter(skill => {
            let id = this.statusObj.get_id({ name: skill, category, color: apron });
            return this.statusObj.is_status(id, Status.ADD);
          }).length;

          // Calculate the number of skills in this category that the user wants to remove
          var num_rem_temp = tot_list.filter(skill => {
            let id = this.statusObj.get_id({ name: skill, category, color: apron });
            return this.statusObj.is_status(id, Status.REM);
          }).length;

          // Add these to the running total
          num_add += num_add_temp;
          num_rem += num_rem_temp;

          // Create the category tile
          content.push({
            type: "category",
            apron, category,
            top: n == 0,
            bottom: n == span - 1,
            num_achieved: ach_list.length,
            num_total:    tot_list.length,
            num_add: num_add_temp,
            num_rem: num_rem_temp,
          });

          // Create the skills list tile
          content.push({
            type: "skills",
            apron, category,
            skills: tot_list.map(skill => {return {skill, achieved: ach_list.includes(skill)};}),
            top: n == 0,
            bottom: n == span - 1,
          });
        });

        // Create the apron tile with properties that were computed in the forEach loop
        var apron_object = {
          type: "apron",
          apron, span, earned,
          num_total:    total,
          num_achieved: achieved,
          num_add, num_rem,
        };

        // Push the apron tab onto the result
        result.push({ apron: apron_object, content });
      });

      return result;
    },

    allow_edits: function() {
      return !(this.allowEdits == false || this.allowEdits == undefined);
    },
  },

  watch: {

    selected_tab: function() {
      this.match_color_to_tab();
    },

    showColor: function() {
      this.match_tab_to_color();
    },
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


    // If the display tabs change, reset the display to be open to the apron the youth is currently working toward
    // Mostly useful when they're first loaded - as far as I can tell, before they're loaded, the b-tabs component won't let the variable it's modeling (selected_tab) go above 0, which has the effect of always setting the active tab back to the first apron.
    // This way, once they load, they ask the parent to ignore whatever they just did and go back to the original show color
    // This could also be achieved by emitting "switch_color" with the youth's next apron, with the caveat that the black apron should loop back on itself, but I think it's nicer to just let the parent handle that -- ideally, then, the next_apron code can be contained in one place
    changed_tabs: function(currentTabs, previousTabs) {
      this.$emit("reset_show_color", null);
      this.match_tab_to_color();
    },


    // Update this.selected_tab to match the current showColor
    match_tab_to_color: function() {

      // Loop through the tabs object until the tab with the desired color is found
      for (var i = 0; i < this.tree_tabs.length; i++) {
        if (this.tree_tabs[i].apron.apron == this.showColor) {

          // Save that index to selected_tab and end the function call
          this.selected_tab = i;
          return;
        }
      }
    },

    // Update this.showColor to match the passed tab
    match_color_to_tab: function() {

      // Check that the parts of the tabs object we need exist
      if (this.tree_tabs != undefined && this.tree_tabs[this.selected_tab] != undefined) {

        // Grab the color value from the tabs object
        var new_color = this.tree_tabs[this.selected_tab].apron.apron;

        // No point in emitting the switch if showColor already matches the tab
        if (new_color != this.showColor) {
          this.$emit("switch_color", new_color);
        }
      }
    },


    apron_active: function(n) {
      return (this.apron_level !== null && n <= this.apron_level);
    },

    section_locked: function(section) {
      return section.apron.earned == false && section.apron.apron != this.currentColor;
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
      return this.get_apron_property(color, 'color', null);
    },

    get_apron_img_status: function(section) {
      if (section.apron.earned != false) {
        return "achieved";
      }

      else if (section.apron.apron == this.currentColor) {
        return "working";
      }

      else {
        return "locked";
      }
    },

    get_apron_tab_class: function(section, index) {
      return [
        'text-dark',
        this.selected_tab == index
          ? `bg-${this.get_apron_progress_variant(section)}`
          : 'bg-light',
      ];
    },

    get_apron_progress_variant: function(section) {
      if (section.apron.earned != false) {
        return "success";
      }

      else if (section.apron.apron == this.currentColor) {
        return "primary";
      }

      else {
        return "secondary";
      }
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

    get_earned_string: function(box) {
      return box.earned.toDate().toLocaleDateString(undefined, {
        weekday: 'long',
        year:    'numeric',
        month:   'long',
        day:     'numeric'
      });
    },

    get_earned_msg: function(apron) {
      if (apron.earned == false) {
        if (apron.apron == this.currentColor) {
          return "Currently Earning";
        }
        return "";
      }
      return "Earned " + apron.earned.toDate().toLocaleDateString(undefined, {
        year:    'numeric',
        month:   'short',
        day:     'numeric'
      });
    },

    get_achieved_skills_list: function(apron, category) {
      if ( this.achievedSkills == undefined
        || this.achievedSkills[apron] == undefined
        || this.achievedSkills[apron].Skills[category] == undefined
        ) {
        return []
      }
      return this.achievedSkills[apron].Skills[category];
    },

    list_item_variant: function(box, skill) {
      let id = this.statusObj.get_id({
        name: skill.skill,
        category: box.category,
        color: box.apron,
      });

      // Use a different color for each possible value
      switch (this.statusObj.get_status(id)) {

        case Status.USE:
          return "success";

        case Status.REM:
          return "danger";

        case Status.ADD:
          return 'warning';

        default:
          return "light";
      }
    },

    toggle_skill: function(box, skill) {
      let id = this.statusObj.get_id({
        name: skill.skill,
        category: box.category,
        color: box.apron,
      });
      this.statusObj.set_status(id, Status.TOGGLE);
    },

    accept_changes: function() {
      console.log("Changes should be accepted!");
    },

    discard_changes: function() {
      console.log("Changes should be discarded!");
    },

    // One of the functions required by the parent - doesn't actually have to do anything in this case
    redraw: function() {}
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

  .tree-card-body-centered {
    padding: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
  }



  .nav-class-test {
    width: 30%;
  }

  .active-nav-item-test {
    border-color: red;
    font-weight: bold;
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