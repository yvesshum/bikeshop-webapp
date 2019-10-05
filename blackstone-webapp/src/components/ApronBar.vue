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
          :colors="apron_colors" :size="32" :level="apron_level"
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
      matchBy="name">
    </MatchTable>

    <b-modal v-model="change_level_modal">
      <template slot="modal-title">
        Please confirm the following.
      </template>

      <h4>The apron color for <em>{{ youth_name }}</em>&nbsp;<small>(ID: {{ profile.id }})</small> will be {{change_level_effect > 0 ? 'increased' : 'decreased'}} by {{Math.abs(change_level_effect)}}:</h4>
      <br />

      <table class="clm_table"><tr>
        <td>
          <ApronImg :color="apron_colors[apron_level].color" :size="48" />
          <b>{{apron_colors[apron_level].name}}</b>
        </td>
        <td class="clm_arrow">&#8658;</td>
        <td>
          <ApronImg :color="apron_colors[apron_level + change_level_effect].color" :size="48" />
          <b>{{apron_colors[apron_level + change_level_effect].name}}</b>
        </td>
      </tr></table>
    </b-modal>

  </div>
</template>

<script>
// @ is an alias to /src
import firebase_app from 'firebase/app';
import firebase_auth from 'firebase/auth';
import ApronImg from '@/components/ApronImg';
import ApronProgressBar from '@/components/ApronProgressBar';
import MatchTable from '@/components/MatchTable';

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
        {title:"Apron", field:"apron", width: 30, formatter:(cell, formatterParams) => {
          let apron = this.apron_colors[cell.getValue()];
          return (apron == null) ? "" : apron.name;
        }},
      ],

      change_level_modal: false,
      change_level_effect: 0,
    }
  },

  computed: {
    profile_data: function() {
      return (this.profile == null) ? null : this.profile.data();
    },

    apron_level: function() {
      return this.get_profile_field("Apron Color", null);
    },

    apron_color: function() {
      if (this.apron_level != null && this.apron_level != -1) {
        return this.apron_colors[this.apron_level].name;
      }
      else {
        return "n/a";
      };
    },

    checked_data: function() {
      return this.get_profile_field("Apron Skills", []);
    },

    youth_name: function() {
      let fn = this.get_profile_field("First Name");
      let ln = this.get_profile_field("Last Name");
      return `${fn} ${ln}`;
    },
  },

  methods: {
    get_profile_field: function(field, default_value) {
      return (this.profile_data == null) ? default_value : this.profile_data[field];
    },

    apron_active: function(n) {
      return (this.apron_level !== null && n <= this.apron_level);
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
      this.$refs.match_table.deselect_values();
      Object.keys(hover_data).forEach(h => {
        if (hover_data[h] != undefined) {
          this.$refs.match_table.select_value("apron", h);
        }
      });
    }
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