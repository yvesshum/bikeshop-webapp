<template>
  <div class="apron_bar">

    <div class="progress_bar_container">
      <b-form-checkbox switch class="mr-n2" v-model="use_table">
        <span>Display as table</span>
      </b-form-checkbox>
    </div>
    <div style="clear: both;"></div>

    <ApronTableView v-show="use_table"
      :loadApronSkills="false"
      :loadApronColors="false"
      :apronSkills="apron_skills"
      :apronColors="apron_colors"
      :achievedSkills="achieved_skills"
      :achievedColor="achieved_color"
      :showColor="show_color"
      :allowEdits="allow_edits"
      @switch_color="switch_color"
      @changed="c => changed_skills = c"
      @load_complete="a => displays.table = a"
      @status_editor="handle_status_editor"
    >
      <template slot="save_buttons">
        <div v-if="has_changes">
          <b-button variant="danger" @click="show_skills_modal(false)" style="margin: 0px 5px;">Discard Changes</b-button>
          <b-button variant="success" @click="show_skills_modal(true)" style="margin: 0px 5px;">Save Changes</b-button>
        </div>
        <div v-else>
          Use the <i>Achieved?</i> column to add & remove skills
        </div>
      </template>
    </ApronTableView>

    <ApronTreeView v-show="!use_table"
      :loadApronSkills="false"
      :loadApronColors="false"
      :apronSkills="apron_skills"
      :apronColors="apron_colors"
      :achievedSkills="achieved_skills"
      :achievedColor="achieved_color"
      :currentColor="next_apron_color"
      :showColor="show_color"
      :allowEdits="allow_edits"
      @switch_color="switch_color"
      @changed="c => changed_skills = c"
      @load_complete="a => displays.tree = a"
      @reset_show_color="reset_show_color"
      :statusObj="status_editor"
    >
      <template slot="header">
        <div class="apron_color_title">
          <h2>Apron Skills</h2>
        </div>
        <div class="progress_bar_container">
          <ApronProgressBar
            style="display: inline-block;"
            :colors="apron_colors" :size="32" :level="apron_level"
            selectType="none"
          />
        </div>
        <div style="clear: both;"></div>
      </template>

      <template slot="increment_buttons">
        <b-button v-if="apron_level < apron_colors.length-1"
          @click="increment_apron"
          variant="secondary"
          style="margin: 5px;"
        >
          Award Next Apron
        </b-button>

        <b-button v-if="apron_level > 0"
          @click="decrement_apron"
          variant="secondary"
          style="margin: 5px;"
        >
          Remove Current Apron
        </b-button>
      </template>

      <template slot="save_buttons">
        <div>
          <b-button
            :variant="has_changes ? 'danger' : 'outline-danger'"
            :disabled="!has_changes"
            @click="show_skills_modal(false)"
            style="margin: 0px 5px;"
          >
            Discard Changes
          </b-button>
          <b-button
            :variant="has_changes ? 'success' : 'outline-success'"
            :disabled="!has_changes"
            @click="show_skills_modal(true)"
            style="margin: 0px 5px;"
          >
            Save Changes
          </b-button>
        </div>
      </template>
    </ApronTreeView>

    <br />

    <div v-show="use_table">

      <ApronEarnedDisplay
        :loadApronInfo="false"
        :apronColors="apron_colors"
        :skillData="achieved_skills"
        :achievedColor="achieved_color"
        @load_complete="a => displays.earned = a"
      />

      <div v-show="allow_edits">

        <b-button v-if="apron_level < apron_colors.length-1"
          @click="increment_apron"
          variant="secondary"
          style="margin: 5px;"
        >
          Award Next Apron
        </b-button>

        <b-button v-if="apron_level > 0"
          @click="decrement_apron"
          variant="secondary"
          style="margin: 5px;"
        >
          Remove Current Apron
        </b-button>

      </div>

    </div>


    <b-modal v-model="change_level_modal" @ok="accept_level_modal">
      <template slot="modal-title">
        <span style="color:black;">Please confirm the following.</span>
      </template>

      <div v-if="change_level_effect > 0">
        {{youth_name}} <small>(ID: {{ youth_id }})</small> will be awarded their <b>{{get_apron_property(apron_level+1, 'name')}} Apron</b>{{apron_level+1 == apron_colors.length-1 ? "." : ","}}
        <span v-if="apron_level+1 != apron_colors.length-1">and will begin working toward their <b>{{get_apron_property(apron_level+1 + change_level_effect, 'name')}} Apron</b>.</span>
      </div>

      <div v-else>
        {{youth_name}} <small>(ID: {{ youth_id }})</small> will have their <b>{{achieved_color}} Apron</b> taken away, making the <b>{{get_apron_property(apron_level-1, 'name')}} Apron</b> their highest apron once again.
      </div>

      <br />

      <table class="clm_table">
        <tr><ApronProgressBar :colors="apron_colors" :size="48" :showStatus="false" :level="apron_level+1" :currentProgress="5" :currentTotal="10" /></tr>
        <tr class="clm_arrow">&dArr;</tr>
        <tr><ApronProgressBar :colors="apron_colors" :size="48" :showStatus="false" :level="apron_level+1 + change_level_effect" :currentProgress="0" /></tr>
      </table>

      <br />

      <div v-if="change_level_effect < 0">
        This will not change the skills they have earned.
      </div>
    </b-modal>

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
          <tr v-for="(skill, index) in skills_to_add" v-bind:key="index + skill" class="change_modal_cell_add">
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
          <tr v-for="(skill, index) in skills_to_remove" v-bind:key="index + skill" class="change_modal_cell_remove">
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
        <b-button class="mt-3" block @click="cancel()" variant="primary">Cancel</b-button>
        <b-button class="mt-3" block @click="accept_skills_modal" :variant="change_skills_effect ? 'success' : 'danger'">
          {{change_skills_effect ? "Accept" : "Discard"}}
        </b-button>
      </template>
    </b-modal>


    <b-modal v-model="success_modal_visible" hide-header>
        <h3>Success!</h3>
    </b-modal>

  </div>
</template>

<script>
// @ is an alias to /src
import {db} from '@/firebase';
import {firebase} from '@/firebase';

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

      success_modal_visible: false,

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

      use_table: false,

      status_editor: new Status(),
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

      this.add_row_spans = []; // eslint-disable-line

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

      spans.forEach(({index, num}) => this.add_row_spans[index] = num); // eslint-disable-line

      return this.changed_skills.add.map(row => row.getData());
    },


    skills_to_remove: function() {

      if (this.changed_skills == null) return [];

      this.rem_row_spans = []; // eslint-disable-line

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

      spans.forEach(({index, num}) => this.remove_row_spans[index] = num); // eslint-disable-line

      return this.changed_skills.rem.map(row => row.getData());
    },


    allow_edits: function() {
      return !(this.allowEdits == false || this.allowEdits == undefined);
    },
  },

  watch: {
    profile: function() {
      this.initialize_data();
    },

    use_table: function() {
      this.$nextTick(() => {
        this.redraw();
      });
    },

    // Broadcast whether there are changes to the parent
    has_changes: function() {
      this.$emit("has_changes", this.has_changes);
    },
  },

  methods: {

    initialize_data: function() {
      this.checked_data = this.get_profile_field("Apron Skills", []);
      this.reset_show_color();
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

      // Initialize changes object
      var changes = {
        "Apron Skills": this.achieved_skills != null ? this.achieved_skills : new Object(),
        "Apron Color": this.get_apron_property(this.apron_level + this.change_level_effect, 'name'),
      };

      // If decrementing, set Achieved back to false
      if (this.change_level_effect == -1) {
        changes["Apron Skills"][this.apron_color].Achieved = false;
      }

      // If incrementing, save the current time
      else {
        var next_color = this.get_apron_property(this.apron_level + 1, 'name');

        // Create a field for the color that's about to be added, if it doesn't exist yet
        if (changes["Apron Skills"][next_color] == null) {
          changes["Apron Skills"][next_color] = { Skills: {} };
        }

        // Save the current timestamp as the time that the apron color is achieved
        changes["Apron Skills"][next_color].Achieved = firebase.firestore.Timestamp.fromDate(new Date());

        // // The following would assign the timestamp on the server side
        // // The problem is, it triggers two onSnapshot events, once for the initial set and once when the value is assigned by the server.  This doesn't play well with the RefTracker, so assigning on the client side seems better to me.
        // changes["Apron Skills"][next_color].Achieved = firebase.firestore.FieldValue.serverTimestamp();
      }

      // Save changes to firebase
        this.$emit("save_changes", {
          changes,

          // Nothing to do on success - updated document handles it all
          success: () => {
            this.success_modal_visible = true;
          },

          // Error updating database
          error: (err) => {
            window.alert("Error: " + err);
            return null;
          }
        });
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

        // Save changes to firebase
        this.$emit("save_changes", {

          // Changes should affect the apron skills list
          changes: {"Apron Skills": new_skills},

          // If update succeeds, update all skills locally
          success: () => {
            this.displays.table.accept_changes();
            this.success_modal_visible = true;
          },

          // Error updating database
          error: (err) => {
            window.alert("Error updating database: ", err);
            return null;
          }
        });
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

    switch_color: function(new_color) {
      this.show_color = new_color;
    },

    reset_show_color: function() {
      this.switch_color(this.is_final_color ? this.apron_color : this.next_apron_color);
    },

    handle_status_editor: function(editor) {
      this.status_editor = editor;
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