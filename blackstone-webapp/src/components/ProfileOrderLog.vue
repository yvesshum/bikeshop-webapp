<template>
  <div class="profile_order_log">

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
import {forKeyVal} from "@/scripts/ParseDB";

// The location of the Order Log header fields in the database
var OrderLogHeadersRef = db.collection("GlobalFieldsCollection").doc("Youth Order Form");

// Fields from database for the Order Log that we don't want to show on this page
var excluded_order_fields = [ "Youth ID", "First Name", "Last Name", "Status", "Period" ];

export default {
  name: 'profile_order_log',
  props: ["snapshot", "periods", "visible"],
  components: {
    ProfileLog,
  },

  data: function() {
    return {
      collection: null,

      table: null,

      // The actual headers will be generated based on what's retrieved from the database
      headers_from_db: [],

    };
  },

  mounted: async function() {

    // Load the Order Log headers from the database
    var headers_db = await OrderLogHeadersRef.get();
    this.headers_from_db = headers_db.data();

    // Load the collections for each log
    this.load_from_snapshot(this.snapshot);
    this.$emit("load_complete", {
      redraw: this.redraw,
    });
  },

  computed: {

    headers: function() {
      var table_headers = [];

      // Define this here to grab the fields in this order
      var groups = ["required", "hidden", "optional"];

      // Loop through each desired table column from the database
      // Stored as key/val pairs, where the key is the field's name and the value is its type
      for (let i in groups) {
        forKeyVal(this.headers_from_db[groups[i]], (field_name, field_type) => {

          // Skip the fields we don't want to show - mostly the youth's info, since it'll be all over the page anyways, and that saves space in the table
          if (excluded_order_fields.includes(field_name)) {
            return;
          }

          // Use different formatter/filter/sorter depending on the field's type
          switch (field_type) {

            case "Datetime":
              table_headers.push({
                title: field_name, field: field_name, __style__: "datetime",
              });
              break;

            case "Hours":
              table_headers.push({
                title: field_name, field: field_name, __style__: "hours",
              });
              break;

            // If the field_name is specifically Notes, add it specially; otherwise fall through to the default case
            case "String":
              if (field_name == "Notes") {
                table_headers.push({
                  title: field_name, field: field_name, __style__: "notes",
                });
                break;
              }

            // If none of the types above, add it pretty much as-is
            case "Phone":
            default:
              table_headers.push({
                title: field_name, field: field_name, headerFilter: true,
              });
              break;
          }
        })
      }

      // Ensure all dates come first and the Notes field comes last
      // TODO: Do something other than __is_date__ field if possible, since Tabulator throws a warning
      table_headers = table_headers.sort((a, b) => {
        if (a.__style__ == "datetime" || b.title == "Notes") return -1;
        return 1;
      });

      return table_headers;
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
      this.collection = (snapshot == null) ? null : snapshot.collection("Order Log");
    },

  }
}
</script>