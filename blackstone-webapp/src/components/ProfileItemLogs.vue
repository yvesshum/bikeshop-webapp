<template>
  <div class="profile_item_logs" style="border-style: solid; border-width: 5px;">
    <p>This is where the item logs go!</p>
    
    <p>Order Log:</p>
    <div id="order_log"></div>

    <p>Work Log:</p>
    <div id="work_log"></div>

  </div>
</template>

<script>
// @ is an alias to /src
import {db} from '../firebase';
import {firebase} from '../firebase';
import firebase_app from 'firebase/app';
import firebase_auth from 'firebase/auth';

var Tabulator = require("tabulator-tables");

export default {
  name: 'profile_item_logs',
  props: ["currentProfile"],
  components: {
    
  },

  watch: {
    currentProfile: function(doc) {
      let orderLogHeaders = ["Item Name", "Item ID", "Item Cost", "Status", "Date", "Notes"];
      let workLogHeaders  = ["Category 1", "Category 2", "Category 3", "Category 4"];
      this.displayTable(doc, "Order Log", orderLogHeaders, "order_log");
      this.displayTable(doc, "Work Log", workLogHeaders, "work_log");
    }
  },

  methods: {
    formatCollection: function(snapshot) { //formats into array of objects
      var ret = [];
      snapshot.forEach(doc => {
        var data = doc.data();
        data["Order Date"] = (new Date(doc.id).toLocaleString());
        data["documentID"] = doc.id; //this is not shown, used for the sake of convenience in setting status later
        ret.push(data);
      });
      return ret;
    },

    getTableColumns: async function(headers) {
      var columns = [];

      for (var i = 0; i < headers.length; i++) {
        columns.push({
          title: headers[i],
          field: headers[i],
          align: "left",
        });
      }
      return columns;
    },

    displayTable: async function(doc, name, headers, div_name) {
      let id = doc.loaded.id;

      var snapshot = await doc.unloaded.collection(name).get();
      
      var tableData = this.formatCollection(snapshot);
      var tableColumns = await this.getTableColumns(headers);

      var table = new Tabulator("#" + div_name, {
        data: tableData,
        layout: "fitColumns",
        columns: tableColumns,
        pagination: "local",
        paginationSize: "20",
        selectable: 1,
        selectableRangeMode:"click",
      });

      async function refreshTable() {
        // let newData = await getPendingOrders(id, name);
        var snapshot = await db.collection("GlobalYouthProfile").doc(id).collection(name).get();
        var newData = this.formatCollection(snapshot);
        table.replaceData(newData);
      }

      //add event listener, on data change refresh table

      db.collection("GlobalPendingOrders").onSnapshot(snapshot => {
        refreshTable(); //problem: This grabs all the data again
      })

    },


    formatStatus: function(data, status){
        var ret = data;
        ret["Status"] = status;
        return ret;
    }
  }
}
</script>