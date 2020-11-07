<template>
  <div class="profile_work_log">

    <ProfileLog
      :snapshot="snapshot"
      :periods="periods"
      :visible="visible"
      :collection="collection"
      :headers="headers"
      :docFormatter="work_doc_formatter"
      :hourCategories="categories"
      @table="handle_table"
    />

  </div>
</template>

<script>
// @ is an alias to /src
import {db} from '../firebase';
import {firebase} from '../firebase';
import ProfileLog from "@/components/ProfileLog.vue"

export default {
  name: 'profile_work_log',
  props: ["snapshot", "periods", "visible", "categories"],
  components: {
    ProfileLog,
  },

  data: function() {
    return {
      collection: null,

      table: null,

      headers: [
        { // The Date
          title: "Date", field: "Date", __style__: "date"
        },
        { // The check in time
          title: "Check In", field: "Check In", __style__: "time"
        },
        { // The check out time
          title: "Check Out", field: "Check Out", __style__: "time"
        },
        { // The hours earned, broken down by category
          title: "Hours", field: "Hours", __style__: "work-hours"
        },
        { // Notes
          title: "Notes", field: "Notes", __style__: "notes"
        },
      ],

    };
  },

  mounted: async function() {
    this.load_from_snapshot(this.snapshot);
    this.$emit("load_complete", {
      redraw: this.redraw,
    });
  },

  computed: {

    // Helper function to group document data for the work log table
    work_doc_formatter: function() {
      return (doc) => {
        var data = doc.data();
        return {
          "Date": [ data["Check In"], data["Check Out"] ],
          "Check In": data["Check In"],
          "Check Out": data["Check Out"],
          "Hours": this.make_hours_obj(data),
          "Notes": data["Notes"],
          "Period": data["Period"],
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
      if (this.table != null) this.table.redraw();
    },

    handle_table: function(table) {
      this.table = table;
    },

    load_from_snapshot: function(snapshot) {
      this.collection = (snapshot == null) ? null : snapshot.collection("Work Log");
    },

    make_hours_obj: function(data) {
      var obj = {};
      for (let i in this.categories) {
        let category = this.categories[i];
        obj[category] = data[category];
      };
      return obj;
    },

  }
}
</script>