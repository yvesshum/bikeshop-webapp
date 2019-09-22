<template>
  <div class="apron_bar">

    <div style="margin: 0px 10px;">
      <h3 style="display: inline-block; margin: auto; padding: 5px; float: left;">Apron Level: {{apron_color}}</h3>

      <div style="display: inline-block; padding: 5px; float: right;">
        <ApronProgressBar style="display: inline-block;" :colors="apron_colors" :size="32" :level="apron_level" />
      </div>
    </div>

    <MatchTable
      style="clear: both;"
      :checkedData="checked_data"
      :fullData="test_full_data"
      :headingData="test_headers"
      matchBy="name">
    </MatchTable>

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
  },

  methods: {
    get_profile_field: function(field, default_value) {
      return (this.profile_data == null) ? default_value : this.profile_data[field];
    },

    apron_active: function(n) {
      return (this.apron_level !== null && n <= this.apron_level);
    },
  }
}
</script>