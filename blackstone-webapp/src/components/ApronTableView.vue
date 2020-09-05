<template>
  <div class="apron_table_view">

    <MatchTable
      ref="match_table"
      style="clear: both;"
      :checkedData="achieved_skills_table"
      :fullData="apron_skills_table"
      :headingData="headers"
      :args="table_args"
      editable
      :matchBy="['name', 'category', 'color']"
      @selected="s => selected_skills = s"
      @changes="handle_changes"
      @table="handle_table"
    />

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
      headers: [
        {title:"Name", field:"name"},
        {title:"Category", field:"category", width: 200},
      ],

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
    }
  },

  created: async function() {
    this.$emit("load_start");
    await this.ensure_data_loaded();
    this.$emit("load_complete");
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
      return this.allowEdits != undefined;
    },


    table_args: function() {
      return (is_achieved_func) => {

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
          },

          // Start all groups closed
          groupStartOpen: false,

          // Display the number of achieved skills for this apron in the header
          groupHeader: (value, count, data, group) => {
            let num_achieved = data.reduce(
              (acc, curr) => acc += (is_achieved_func(curr) ? 1 : 0)
              , 0
            );
            return `${value} Apron Skills <span style='float:right;'>${num_achieved}/${count} Achieved</span>`;
          },
        };
      };
    },
  },

  watch: {
    showColor: function() {
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
  }
}
</script>
