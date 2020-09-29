<template>
  <div class="profile_transfer_log">

    <ProfileLog
      :snapshot="snapshot"
      :periods="periods"
      :visible="visible"
      :collection="collection"
      :headers="headers"
      :docFormatter="doc_formatter"
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
        { // The date and time of the order
          title: "Date", field: "Date", __style__: "date",
        },
        { // The name of the recipient
          title: "Transaction Type", field: "Type",
          editor: "select", headerFilter: true,
          headerFilterParams: {"Sent": "Sent", "Received": "Received"}
        },
        { // The number of hours transferred
          title: "Amount Transferred", field: "Amount", __style__: "hours",
        },
        { // The name of the recipient
          title: "Other Person's Name", field: "Other Name",
          headerFilter: true, headerFilterFunc: filter
        },
        { // The ID of the recipient
          title: "Other Person's ID", field: "Other ID", headerFilter: true,
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

    // Generalize To & From Name/ID into one field, and add "Type" field to tell which one
    doc_formatter: function() {
      return (doc) => {
        var data = doc.data();
        var received = data["To ID"] == undefined;

        return {
          "Type":       received ? "Received"        : "Sent",
          "Other Name": received ? data["From Name"] : data["To Name"],
          "Other ID":   received ? data["From ID"]   : data["To ID"],
          ...data
        };
      };
    },

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