<template>
  <div class="apron_table_view">

    <MatchTable
      ref="match_table"
      style="clear: both;"
      :checkedData="achieved_skills_table"
      :fullData="apron_skills_table"
      :headingData="headers"
      :args="table_args"
      :editable="allow_edits"
      :matchBy="['name', 'category', 'color']"
      :showHeaderFilter="true"
      @selected="s => selected_skills = s"
      @changes="handle_changes"
      @table="handle_table"
      @status_editor="handle_status_editor"
    />

    <slot name="save_buttons"></slot>

  </div>
</template>

<script>
// @ is an alias to /src
import {db} from '@/firebase';
import {firebase} from '@/firebase';
import MatchTable from '@/components/MatchTable';
import {Status} from '@/scripts/Status.js';
import {forKeyVal} from '@/scripts/ParseDB.js';
import {forEach_ObjObjArr} from '@/scripts/ParseDB.js';

let ApronColorsRef = db.collection("GlobalVariables").doc("Apron Colors");
let ApronSkillsRef = db.collection("GlobalVariables").doc("Apron Skills");

export default {
  name: 'apron_table_view',

  components: {
    MatchTable,
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

    showColor: {
      type: String,
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
      apron_color: null,

      table: null,

      loaded_apron_skills: [],
      loaded_apron_colors: [],

      swapping_color: false,
    }
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

    skill_categories: function() {
      return this.apron_skills == undefined ? [] : Object.keys(this.apron_skills);
    },

    colors_to_indices: function() {
      var result = {};
      for (let i in this.apronColors) {
        result[this.apronColors[i].name] = i;
      }
      return result;
    },

    // Flatten the nested object structure of the skills in the database to individual rows
    // as used by Tabulator
    apron_skills_table: function() {
      let result = [];
      forEach_ObjObjArr(this.apron_skills, (category, color, index, entry) => {
        result.push({color, category, name: entry});
      });

      // Sort entries by color, then category, then name
      result.sort((a, b) => {
        if (a.color == b.color) {
          if (a.category == b.category) {
            return a.name.localeCompare(b.name);
          }
          return a.category.localeCompare(b.category);
        }
        return this.color_to_index(a.color) - this.color_to_index(b.color);
      });

      return result;
    },

    achieved_skills_table: function() {

      if (this.achievedSkills == null) return [];

      let result = [];

      this.apronColors.forEach(color => {

        if (this.achievedSkills[color.name] !== undefined) {

          forKeyVal(this.achievedSkills[color.name].Skills, (category, skills) => {
            skills.forEach(skill => {
              result.push([skill, category, color.name]);
            })
          });
        }
      });

      return result;
    },


    has_changes: function() {
      return this.skills_to_add.length > 0 || this.skills_to_remove.length > 0;
    },

    // TODO: Attach the type of the skill (mechanical, life, etc) to these objects
    skills_to_add: function() {
      return (this.changed_skills == null) ? [] : this.changed_skills.add;
    },

    skills_to_remove: function() {
      return (this.changed_skills == null) ? [] : this.changed_skills.rem;
    },

    allow_edits: function() {
      return !(this.allowEdits == false || this.allowEdits == undefined);
    },



    // The headers to use in the table
    headers: function() {

      // Custom sorter that ensures apron color groups stay in proper order regardless of sort
      var sorter = (a, b, aRow, bRow, column, dir, sorterParams) => {
        var aColor = aRow.getData().color;
        var bColor = bRow.getData().color;
        if (aColor !== bColor) {
          return this.apronColors.indexOf(aColor) - this.apronColors.indexOf(bColor);
        }
        return a.localeCompare(b);
      }

      var category_options = {};
      this.skill_categories.forEach(category => {
        category_options[category] = category;
      });

      // The headers
      return [
        {
          title:"Name", field:"name",
          sorter: sorter,
          headerFilter: "input"
        },
        {
          title:"Category", field:"category",
          width: 200, sorter: sorter,
          editor: "select", headerFilter: true,
          headerFilterParams: category_options
        },
      ];
    },


    table_args: function() {
      return (is_status) => {

        // Create the object
        return {

          // Group the skills by apron color
          groupBy: 'color',

          // Don't allow resizing
          resizeableRows: false,
          resizeableColumns: false,

          // Allow multiple selection with ctrl and shift keys
          selectable: true,

          // Allow groups to open/close by clicking anywhere in header (not just the arrow)
          groupToggleElement:"header",

          // Ensure that only one group is open at any time by closing all other groups
          // Looks like this runs before whatever callback actually toggles the group open/closed on click, so if we hide an open group, it will be switched back to open, which is what we want
          groupClick: (e, group) => {
            this.table.getGroups().forEach(g => g.hide());
            this.swapping_color = true;
            this.$emit("switch_color", group.getKey());
          },

          // Start all groups closed
          groupStartOpen: false,

          // Display the number of achieved skills for this apron in the header
          groupHeader: (value, count, data, group) => {

            // If the achievedSkills prop has not yet been passed, we don't have anything to display
            // Removing this doesn't break anything, it just throws a bunch of console errors on window resize, so this is a bit cleaner from the front-end
            if (this.achievedSkills == null) {
              return "";
            }

            // Get the number of achieved skills and number of pending changes for this group
            var num_achieved = data.reduce((acc, c) => acc += (is_status(c, Status.U) ? 1 : 0), 0);
            var num_pending  = data.reduce((acc, c) => acc += (is_status(c, Status.C) ? 1 : 0), 0);

            var apron_level = this.achievedSkills[value];

            // Generate the apron color label
            var label = `${value} Apron Skills`;

            // If applicable, display the date this apron level was earned
            var datestamp = '';
            if (apron_level != undefined && apron_level.Achieved !== false && apron_level.Achieved !== undefined) {
              let date = new Date(apron_level.Achieved.seconds * 1000);
              datestamp = ` &mdash; Earned ${date.toDateString()}`;
            }

            // Generate pending and achieved messages
            var pending  = num_pending > 0 ? `${num_pending} Pending Change${num_pending == 1 ? '' : 's'},` : '';
            var achieved = `${num_achieved}/${count} Achieved`;

            return `${label}${datestamp}<span style='float:right;'>${pending} ${achieved}</span>`;
          },
        };
      };
    },
  },

  watch: {
    showColor: function() {
      // if (this.swapping_color) {
      //   this.swapping_color = false;
      //   return;
      // }
      if (this.table == null) return "";
      this.table.getGroups().forEach(group => {
        if (group.getKey() == this.showColor) {
          group.show();
        } else {
          group.hide();
        }
      });
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

    get_profile_field: function(field, default_value) {
      return (this.profile_data == null) ? default_value : this.profile_data[field];
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

    apron_active: function(n) {
      return (this.apron_level !== null && n <= this.apron_level);
    },

    get_apron_property: function(level, prop) {
      if (this.apron_colors == null || this.apron_colors[level] == null) return "";
      return this.apron_colors[level][prop];
    },

    color_to_index: function(color) {
      return this.colors_to_indices[color];
    },

    handle_changes: function(changes) {
      this.changed_skills = changes;
      this.$emit('changed', changes);
    },

    handle_table: function(table) {
      this.table = table;
    },

    handle_status_editor: function(editor) {
      this.$emit("status_editor", editor);
    },

    accept_changes: function() {
      this.$refs.match_table.accept_changes();
    },

    discard_changes: function() {
      this.$refs.match_table.discard_changes();
    },

    redraw: function() {
      this.table.redraw();
    },
  }
}
</script>
