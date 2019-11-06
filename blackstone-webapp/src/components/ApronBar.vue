<template>
  <div class="apron_bar">

    <div class="title_container">
      <h3 class="apron_color_title">Apron Color: {{apron_color}}</h3>

      <div class="progress_bar_container">
        <b-button
          style="display: inline-block; float: left"
          :disabled="apron_level <= 0"
          variant="primary"
          @click="decrement_apron"
          v-b-tooltip.hover.html="'Decrement Apron Color'"
        >-</b-button>
        <ApronProgressBar
          style="display: inline-block;"
          :colors="apron_colors" :size="32" :level="apron_level+1"
          @hover="hover"
        />
        <b-button
          style="display: inline-block; float: right"
          :disabled="apron_level >= apron_colors.length-1"
          variant="primary"
          @click="increment_apron"
          v-b-tooltip.hover.html="'Increment Apron Color'"
        >+</b-button>
      </div>

      <div style="clear: both;"></div>
    </div>

    <MatchTable
      ref="match_table"
      style="clear: both;"
      :checkedData="checked_data"
      :fullData="test_full_data"
      :headingData="test_headers"
      editable
      matchBy="name"
      @selected="s => selected_skills = s"
      @changes="c => changed_skills = c"
    >
    </MatchTable>

    <b-modal v-model="change_level_modal">
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
    <div v-if="has_changes">
      <b-button variant="success" @click="show_skills_modal(true)">Save Changes</b-button>
      <b-button variant="danger" @click="show_skills_modal(false)">Discard Changes</b-button>
    </div>
    <div v-else>
      <b-button disabled>Select skills to add or remove</b-button>
    </div>

    <b-modal v-model="change_skills_modal">
      <template slot="modal-title">
        Please confirm the following.
      </template>

      <h4>The following changes will be {{change_skills_effect ? "saved" : "discarded"}}:</h4>
      <br />

      <table style="margin: auto;">
        <tr>
          <th class="change_modal_header">Removed Skills</th>
          <th class="change_modal_header">Added Skills</th>
        </tr>
        <tr>
          <td class="change_modal_cell_remove">
            <div v-for="skill in skills_to_remove">{{skill}}</div>
          </td>
          <td class="change_modal_cell_add">
            <ul>
              <li v-for="skill in skills_to_add">{{skill}}</li>
            </ul>
          </td>
        </tr>
      </table>

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
import MatchTable from '@/components/MatchTable';
import {Status} from '@/components/Status.js';

export default {
  name: 'apron_bar',

  components: {
    ApronImg,
    ApronProgressBar,
    MatchTable,
  },

  props: ['profile'],

  data: function() {
    return {
      // TODO: Draw these from database
      apron_colors: [
        {name: "Gray",   color: -1},
        {name: "Green",  color: 140},
        {name: "Red",    color: 0},
        {name: "Purple", color: 270},
        {name: "Black",  color: 361},
      ],

      // TODO: Draw these from database
      test_full_data: [
        {name: 'Time management', group: 'Life' ,      p: '25', apron: 1},
        {name: 'Budgeting',       group: 'Life',       p: '50', apron: 0},
        {name: 'Gears',           group: 'Mechanical', p: '75', apron: 2},
        {name: 'Pedals',          group: 'Mechanical', p: '75', apron: 3},
        {name: 'Breaks',          group: 'Mechanical', p: '75', apron: 2},
        {name: 'Talking',         group: 'Talking' ,   p: '75', apron: 4},
      ],

      test_headers: [
        {title:"Name", field:"name"},
        {title:"Apron", field:"apron", width: 100, formatter:(cell, formatterParams) => {
          let apron = this.apron_colors[cell.getValue()];
          return (apron == null) ? "" : apron.name;
        }},
      ],

      change_level_modal: false,
      change_level_effect: 0,

      change_skills_modal: false,
      change_skills_effect: 0,

      selected_skills: [],

      changed_skills: null,

      checked_data: [],
      apron_color: null,
    }
  },

  mounted: function() {

  },

  computed: {
    profile_data: function() {
      return (this.profile == null) ? null : this.profile.data();
    },

    apron_level: function() {
      // return this.get_profile_field("Apron Color", null);
      return this.apron_colors.map(c => c.name).indexOf(this.selected);
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

    // TODO: Attach the type of the skill (mechanical, life, etc) to these objects
    skills_to_add: function() {
      return (this.changed_skills == null) ? [] : this.changed_skills.add;
    },

    skills_to_remove: function() {
      return (this.changed_skills == null) ? [] : this.changed_skills.rem;
    },
  },

  watch: {
    profile: function() {
      this.checked_data = this.get_profile_field("Apron Skills", []);
      this.apron_color = this.get_profile_field("Apron Color", null);
    },
  },

  methods: {
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

    increment_apron: function() {
      this.change_level_effect = 1;
      this.change_level_modal = true;
    },

    decrement_apron: function() {
      this.change_level_effect = -1;
      this.change_level_modal = true;
    },

    hover: function(hover_data) {
      let highlight_vals = Object.keys(hover_data)
        .filter(h => hover_data[h] != undefined)
        .map(h => parseInt(h));

      this.$refs.match_table.highlight_values(highlight_vals, "apron");
    },

    show_skills_modal: function(val) {
      this.change_skills_effect = val;
      this.change_skills_modal = true;
    },

    accept_skills_modal: function() {
      // Add all changed skills to the database
      if (this.change_skills_effect) {

        // Make new changes object for apron skills list
        let changes = {"Apron Skills": this.changed_skills.use};

        // Saves edits to firebase
        db.collection('GlobalYouthProfile').doc(this.youth_id).update(changes).catch(err => {
          window.alert("Error: " + err);
          return null;
        });

        // If update succeeds, update all skills locally
        this.$refs.match_table.accept_changes();
      }

      // Reset all the changed but unsaved skills to their original values
      else {
        this.$refs.match_table.discard_changes();
      }

      this.change_skills_modal = false;
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