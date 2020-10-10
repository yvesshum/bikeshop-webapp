<template>
  <div class="apron_bar">

    <!-- <div class="title_container">

      <h3>Apron Skills</h3>

      <div class="apron_color_title">
        <h4>Current Apron: {{apron_color}}</h4>
        <h4 v-if="!is_final_color">Next Apron: {{next_apron_color}}</h4>
      </div>

      <div class="progress_bar_container">
        <b-button
          style="display: inline-block; float: left"
          :disabled="apron_level <= 0"
          variant="primary"
          @click="decrement_apron"
          v-b-tooltip.hover.html="'Decrement Apron Color'"
          v-if="allow_edits"
        >-</b-button>
        <ApronProgressBar
          style="display: inline-block;"
          :colors="apron_colors" :size="32" :level="apron_level"
          selectType="none"
        />
        <b-button
          style="display: inline-block; float: right"
          :disabled="apron_level >= apron_colors.length-1"
          variant="primary"
          @click="increment_apron"
          v-b-tooltip.hover.html="'Increment Apron Color'"
          v-if="allow_edits"
        >+</b-button>
      </div>

      <div style="clear: both;"></div>
    </div> -->

    <!-- <ApronTableView
      :loadApronSkills="false"
      :loadApronColors="false"
      :apronSkills="apron_skills"
      :apronColors="apron_colors"
      :achievedSkills="achieved_skills"
      :achievedColor="achieved_color"
      :showColor="show_color"
      @changed="c => changed_skills = c"
      @load_complete="a => displays.table = a"
    /> -->

    <ApronTreeView
      :loadApronSkills="false"
      :loadApronColors="false"
      :apronSkills="apron_skills"
      :apronColors="apron_colors"
      :achievedSkills="achieved_skills"
      :achievedColor="achieved_color"
      :showColor="show_color"
      @changed="c => changed_skills = c"
      @load_complete="a => displays.tree = a"
    />

    <ApronEarnedDisplay
      :loadApronInfo="false"
      :apronColors="apron_colors"
      :skillData="achieved_skills"
      :achievedColor="achieved_color"
      @load_complete="a => displays.earned = a"
    />

    <b-modal v-model="change_level_modal" @ok="accept_level_modal">
      <template slot="modal-title">
        Please confirm the following.
      </template>

      <h4>The apron color for <em>{{ youth_name }}</em>&nbsp;<small>(ID: {{ youth_id }})</small> will be {{change_level_effect > 0 ? 'increased' : 'decreased'}} by {{Math.abs(change_level_effect)}}:</h4>
      <br />

      <table class="clm_table"><tr>
        <td>
          <ApronImg :color="get_apron_property(apron_level, 'color')" :size="48" />
          <b>{{get_apron_property(apron_level, 'name')}}</b>
        </td>
        <td class="clm_arrow">&#8658;</td>
        <td>
          <ApronImg :color="get_apron_property(apron_level + change_level_effect, 'color')" :size="48" />
          <b>{{get_apron_property(apron_level + change_level_effect, 'name')}}</b>
        </td>
      </tr></table>
    </b-modal>

    <!-- <div v-if="selected_skills.length > 0">
      <b-button variant="success" @click="set_selected_skills(true);">Add Selected Skills</b-button>
      <b-button variant="danger" @click="set_selected_skills(false);">Remove Selected Skills</b-button>
    </div> -->
    <div v-if="allow_edits">
      <div v-if="has_changes">
        <b-button variant="success" @click="show_skills_modal(true)">Save Changes</b-button>
        <b-button variant="danger" @click="show_skills_modal(false)">Discard Changes</b-button>
      </div>
      <div v-else>
        <b-button disabled>Use the <i>Achieved?</i> column above to add & remove skills</b-button>
      </div>
    </div>

    <b-modal v-model="change_skills_modal">
      <template slot="modal-title">
        <h2 style="color:black;">{{change_skills_effect ? "Save" : "Discard"}} Changes</h2>
      </template>

      <div v-if="skills_to_add.length > 0">

        <p>
          The following skills will {{change_skills_effect ? "be " : ""}}<b>{{change_skills_effect ? "added " : "not be added "}}</b>to {{youth_name}}'s profile.
        </p>

        <table style="margin: auto;">
          <tr>
            <td class="change_modal_header" style="width:25%">Apron Color</td>
            <td class="change_modal_header" style="width:50%">Skill Name</td>
            <td class="change_modal_header" style="width:25%">Skill Category</td>
          </tr>
          <tr v-for="(skill, index) in skills_to_add" class="change_modal_cell_add">
            <td v-if="index == 0 || skills_to_add[index-1].color != skill.color" :rowspan="add_row_spans[index]" style="border-right: 1px solid black;">
              <ApronImg :color="apron_name_to_color(skill.color, 'color')" :size="48" style="margin-top: 10px;" />
              {{skill.color}}
            </td>
            <td>{{skill.name}}</td>
            <td>{{skill.category}}</td>
          </tr>
        </table>

      </div>

      <br>

      <div v-if="skills_to_remove.length > 0">

        <p>
          The following skills will {{change_skills_effect ? "be " : ""}}<b>{{change_skills_effect ? "removed from " : "remain in "}}</b> {{youth_name}}'s profile.
        </p>

        <table style="margin: auto;">
          <tr>
            <td class="change_modal_header" style="width:25%">Apron Color</td>
            <td class="change_modal_header" style="width:50%">Skill Name</td>
            <td class="change_modal_header" style="width:25%">Skill Category</td>
          </tr>
          <tr v-for="(skill, index) in skills_to_remove" class="change_modal_cell_remove">
            <td v-if="index == 0 || skills_to_remove[index-1].color != skill.color" :rowspan="remove_row_spans[index]" style="border-right: 1px solid black;">
              <ApronImg :color="apron_name_to_color(skill.color, 'color')" :size="48" style="margin-top: 10px;" />
              {{skill.color}}
            </td>
            <td>{{skill.name}}</td>
            <td>{{skill.category}}</td>
          </tr>
        </table>

      </div>

      <template slot="modal-footer" slot-scope="{cancel}">
        <b-button class="mt-3" block @click="accept_skills_modal" :variant="change_skills_effect ? 'success' : 'danger'">
          {{change_skills_effect ? "Accept" : "Discard"}}
        </b-button>
        <b-button class="mt-3" block @click="cancel()" variant="primary">Cancel</b-button>
      </template>
    </b-modal>

  </div>
</template>

<script>
// @ is an alias to /src
import {db} from '@/firebase';
import {firebase} from '@/firebase';
import firebase_app from 'firebase/app';
import firebase_auth from 'firebase/auth';
import ApronImg from '@/components/ApronImg';
import ApronProgressBar from '@/components/ApronProgressBar';
import ApronTableView from '@/components/ApronTableView';
import ApronTreeView from '@/components/ApronTreeView';
import ApronEarnedDisplay from '@/components/ApronEarnedDisplay';
import {Status} from '@/scripts/Status.js';

let ApronColorsRef = db.collection("GlobalVariables").doc("Apron Colors");
let ApronSkillsRef = db.collection("GlobalVariables").doc("Apron Skills");

export default {
  name: 'apron_bar',

  components: {
    ApronImg,
    ApronProgressBar,
    ApronTableView,
    ApronTreeView,
    ApronEarnedDisplay,
  },

  props: {
    profile: Object,

    allowEdits: {
      type: Boolean,
      default: false,
    },

    loadApronColors: {
      type: Boolean,
      default: true,
    },

    apronColors: {
      type: Array,
      default: null,
    },

    loadApronSkills: {
      type: Boolean,
      default: true,
    },

    apronSkills: {
      type: Object,
      default: null,
    },
  },

  data: function() {
    return {

      change_level_modal: false,
      change_level_effect: 0,

      change_skills_modal: false,
      change_skills_effect: 0,

      selected_skills: [],

      changed_skills: null,

      checked_data: [],

      show_color: null,

      loaded_apron_skills: null,
      loaded_apron_colors: [],

      add_row_spans: [],
      remove_row_spans: [],

      displays: {
        table: null,
        tree: null,
        earned: null,
      },
    }
  },

  created: async function() {
    this.$emit("load_start");
    await this.ensure_data_loaded();
    this.$emit("load_complete", this);
  },

  mounted: function() {
    this.initialize_data();
  },

  computed: {

    /* The object containing the apron skills
     *
     * Depending on the loadApronColors prop, this will either be passed in as a prop
     * or loaded from the database
     */
    apron_skills: function() {
      if (this.loadApronSkills == true && this.apronSkills == null) {
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

      // If the parent isn't passing in an apronColors array, load them from the database manually
      if (this.loadApronColors == true && this.apronColors == null) {
        return this.loaded_apron_colors;
      }

      // If an apronColors array was passed in as a prop, return that
      else if (this.apronColors != null) {
        return this.apronColors;
      }

      // Default to an empty array
      else {
        return [];
      }
    },

    apron_color: function() {
      return this.get_profile_field("Apron Color", null)
    },

    is_final_color: function() {
      return this.apron_level == this.apron_colors.length;
    },

    next_apron_color: function() {
      return this.is_final_color ? null : this.get_apron_property(this.apron_level + 1, 'name');
    },

    achieved_skills: function() {
      return this.get_profile_field("Apron Skills", null);
    },

    achieved_color: function() {
      return this.get_profile_field("Apron Color", "");
    },

    profile_data: function() {
      return (this.profile == null) ? null : this.profile.data();
    },

    apron_level: function() {
      // return this.get_profile_field("Apron Color", null);
      return this.apron_colors.map(c => c.name).indexOf(this.apron_color);
    },

    // apron_color: function() {
    //   // return this.get_profile_field("Apron Color", null);
    //   // let color = this.get_profile_field("Apron Color", null);
    //   if (this.apron_level != null && this.apron_level != -1) {
    //     return this.apron_colors[this.apron_level].name;
    //   }
    //   else {
    //     return "n/a";
    //   };
    // },

    youth_name: function() {
      let fn = this.get_profile_field("First Name");
      let ln = this.get_profile_field("Last Name");
      return `${fn} ${ln}`;
    },

    youth_id: function() {
      return (this.profile != null) ? this.profile.id : "";
    },

    has_changes: function() {
      return this.skills_to_add.length > 0 || this.skills_to_remove.length > 0;
    },


    skills_to_add: function() {

      if (this.changed_skills == null) return [];

      this.add_row_spans = [];

      var spans = this.changed_skills.add.reduce((acc, curr, i) => {
        let color = curr.getData().color;
        if (acc.color != color) {
          acc.color = color;
          acc.spans.push({index: i, num: 1});
        }
        else {
          acc.spans[acc.spans.length-1].num ++;
        }
        return acc;
      }, {color: null, spans: []}).spans;

      spans.forEach(({index, num}) => this.add_row_spans[index] = num);

      return this.changed_skills.add.map(row => row.getData());
    },


    skills_to_remove: function() {

      if (this.changed_skills == null) return [];

      this.rem_row_spans = [];

      var spans = this.changed_skills.rem.reduce((acc, curr, i) => {
        let color = curr.getData().color;
        if (acc.color != color) {
          acc.color = color;
          acc.spans.push({index: i, num: 1});
        }
        else {
          acc.spans[acc.spans.length-1].num ++;
        }
        return acc;
      }, {color: null, spans: []}).spans;

      spans.forEach(({index, num}) => this.remove_row_spans[index] = num);

      return this.changed_skills.rem.map(row => row.getData());
    },


    allow_edits: function() {
      return this.allowEdits != undefined;
    },
  },

  watch: {
    profile: function() {
      this.initialize_data();
    },
  },

  methods: {

    initialize_data: function() {
      this.checked_data = this.get_profile_field("Apron Skills", []);
      this.show_color = this.is_final_color ? this.apron_color : this.next_apron_color;
    },

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

    get_profile_field: function(field, default_value) {
      return (this.profile_data == null) ? default_value : this.profile_data[field];
    },

    apron_active: function(n) {
      return (this.apron_level !== null && n <= this.apron_level);
    },

    get_apron_property: function(level, prop) {
      if (this.apron_colors == null || this.apron_colors[level] == null) return "";
      return this.apron_colors[level][prop];
    },

    apron_name_to_color: function(name) {
      var level = this.apron_colors.map(c => c.name).indexOf(name);
      return this.get_apron_property(level, "color");
    },

    get_skill_name: function(color, group, index) {
      if ( this.apron_skills == null
        || this.apron_skills[color] == null
        || this.apron_skills[color][group] == null
      ) {
        return null;
      }
      else {
        return this.apron_skills[color][group][index];
      }
    },

    increment_apron: function() {
      this.change_level_effect = 1;
      this.change_level_modal = true;
    },

    decrement_apron: function() {
      this.change_level_effect = -1;
      this.change_level_modal = true;
    },

    accept_level_modal: function() {
      var new_color = this.get_apron_property(this.apron_level + this.change_level_effect, 'name');

      var changes = {
        "Apron Color": new_color,
      };

      console.log("Saving changes to database:", changes);

      db.collection('GlobalYouthProfile').doc(this.youth_id).update(changes).catch(err => {
        window.alert("Error: " + err);
        return null;
      });

      this.apron_color = new_color;
    },

    show_skills_modal: function(val) {
      this.change_skills_effect = val;
      this.change_skills_modal = true;
    },

    accept_skills_modal: function() {
      // Add all changed skills to the database
      if (this.change_skills_effect) {

        // Construct new_skills object by running through the existing object and copying all
        // the skills that aren't to be removed
        var old_skills = this.achieved_skills;
        var new_skills = {};

        // Loop through each apron color, copying the metadata and all the skills that the user hasn't selected for removal
        Object.keys(old_skills).forEach(color => {

          // Copy the metadata from the profile's version, without any of the skills
          // Using spread operator makes sure these are cloned instead of reused, so that when we clear the Skills object it doesn't also delete the local version of the profile
          new_skills[color] = {...old_skills[color]};
          new_skills[color].Skills = {};

          // Copy each category
          Object.keys(old_skills[color].Skills).forEach(category => {

            // Set the new_skills field to its corresponding field in old_skills, filtering out all the skills that the user just removed
            new_skills[color].Skills[category] = old_skills[color].Skills[category].filter(skill => {

              // Loop through each skill to be removed
              // Using explicit for loop allows this to terminate as soon as the skill is found
              for (var i = 0; i < this.skills_to_remove.length; i++) {
                var curr = this.skills_to_remove[i];

                // If the color, category, and skill fields match, this skill should be removed
                if (curr.color == color && curr.category == category && curr.name == skill) {
                  return false;
                }
              }

              // If none of them matched, this skill should not be filtered out
              return true;
            });
          });
        });

        // By this point, new_skills contains all the metadata and all the skills that the user wants to keep, but not yet any skills they want to add

        // Loop through each skill to be added and put it in the new_skills object, creating as many containing fields (for apron colors & skills) as necessary
        this.skills_to_add.forEach(skill => {

          // Ensure the path to the skill's apron color & category exists by creating it if it doesn't already
          // Use a switch statement rather than if statements to take advantage of fall-through
          switch (true) {

            // If the youth doesn't have an entry for this skill's color yet, make an empty one
            case (new_skills[skill.color] == undefined):
              new_skills[skill.color] = {Skills: {}, Achieved: false};

            // If no entry for this skill's category yet, make an empty one
            // Note that if entry for color didn't exist yet, entry for category won't either, so that case falls through to this one
            case (new_skills[skill.color].Skills[skill.category] == undefined):
              new_skills[skill.color].Skills[skill.category] = [];
          }

          // Now that we know this field exists, we can push the current skill to it
          new_skills[skill.color].Skills[skill.category].push(skill.name);
        });

        // Make new changes object for apron skills list
        let changes = {"Apron Skills": new_skills};

        // Save changes to firebase
        db.collection('GlobalYouthProfile').doc(this.youth_id).update(changes).then(

          // Data updated successfully
          // If update succeeds, update all skills locally
          () => {
            this.displays.table.accept_changes();
          },

          // Error updating database
          (err) => {
            window.alert("Error updating database: ", err);
            return null;
          }
        );
      }

      // Reset all the changed but unsaved skills to their original values
      else {
        this.displays.table.discard_changes();
      }

      // After saving or discarding changes, close the modal
      this.change_skills_modal = false;
    },

    redraw: function() {
      if (this.displays.table != null)  this.displays.table.redraw();
      if (this.displays.earned != null) this.displays.earned.redraw();
    },
  }
}
</script>

<style scoped>

  .title_container {
    margin: 0px 10px;
  }

  .apron_color_title {
    display: inline-block;
    margin: auto;
    padding: 5px;
    float: left;
    text-align: left;
  }

  .progress_bar_container {
    display: inline-block;
    padding: 5px;
    float: right;
    height: auto;
  }

  .progress_bar_container:after {
    clear: both;
    content: "";
    display: table;
  }

  .clm_table {
    margin: auto;
    text-align: center;
  }

  .clm_arrow {
    padding: 10px;
    font-size: 200%
  }
</style>