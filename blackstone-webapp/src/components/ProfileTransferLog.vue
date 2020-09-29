<template>
  <div class="profile_transfer_log">

    <ProfileLog
      :snapshot="snapshot"
      :periods="periods"
      :visible="visible"
      :collection="collection"
      :headers="headers"
      @table="handle_table"
    />

  </div>
</template>

<script>
// @ is an alias to /src
import {db} from '../firebase';
import {firebase} from '../firebase';
import ProfileLog from "@/components/ProfileLog.vue"
import {filter} from "@/scripts/Search.js";

export default {
  name: 'profile_transfer_log',
  props: ["snapshot", "periods", "visible"],
  components: {
    ProfileLog,
  },

  data: function() {
    return {
      collection: null,

      table: null,

      headers: [
        { // The name of the recipient
          title: "To Name", field: "To Name",
          headerFilter: true, headerFilterFunc: filter
        },
        { // The ID of the recipient
          title: "To ID", field: "To ID", headerFilter: true,
        },
        { // The number of hours transferred
          title: "Amount Transferred", field: "Amount", __style__: "hours",
        },
        { // The date and time of the order
          title: "Date", field: "Date", __style__: "date",
        },
        { // Notes
          title: "Notes", field: "Notes", __style__: "notes",
        },
      ],

    };
  },

  mounted: async function() {
    this.load_from_snapshot(this.snapshot);
    this.$emit("load_complete", this);
  },

  computed: {

  },

  watch: {
    snapshot: function(snapshot) {
      this.load_from_snapshot(this.snapshot);
    },
  },

  methods: {

    redraw: function() {
      this.table.redraw();
    },

    handle_table: function(table) {
      this.table = table;
    },

    load_from_snapshot: function(snapshot) {
      this.collection = (snapshot == null) ? null : snapshot.collection("Transfer Log");
    },

  }
}
</script>