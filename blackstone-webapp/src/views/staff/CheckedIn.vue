<!--Values in this table are naturally reactive to changes to realtime database-->
<template>
  <div>
    <div class="content">
    <top-bar />
    <h1 class="title">Currently Checked-In Youth</h1>
    <PageHeader pageCategory="Staff Headers" pageName="Currently Checked In"></PageHeader>

    <ProfilePopup :ID="selected_youth_id"
      style="margin-bottom: 1rem"
    />

    <b-table
      :items="items"
      :fields="fields"
      responsive="sm"
      :sort-by.sync="sortBy"
      :sort-desc.sync="sortDesc"
      :busy="isBusy"
      selectable
      select-mode="single"
      selectedVaraint="success"
      @row-selected="rowSelected"
    >
      <div slot="table-busy" class="text-center text-danger my-2">
        <b-spinner class="align-middle"></b-spinner>
        <strong>Loading...</strong>
      </div>
    </b-table>

    </div>
    <Footer/>
  </div>
</template>

<script>
import { rb } from "../../firebase";
import { db } from "../../firebase";
import moment from "moment";
import ProfilePopup from "@/components/ProfilePopup.vue";
import ApronBar from "@/components/ApronBar.vue"
import CollectionTable from "@/components/CollectionTable.vue"
import {Period} from "@/scripts/Period.js";
import {mapKeyVal} from "@/scripts/ParseDB.js";
import PageHeader from "@/components/PageHeader.vue"

let checkedInRef = rb.ref("Checked In");

export default {
  name: "CheckedIn",
  components: {
    ProfilePopup,
    ApronBar,
    PageHeader,
  },
  data() {
    return {
      sortBy: "Check In Time",
      sortDesc: false,
      fields: [],
      items: [],
      isBusy: true,
      selected: [],
    };
  },

  computed: {
    selected_youth_id: function() {
      if (this.selected == undefined || this.selected[0] == undefined) {
        return undefined;
      }
      return this.selected[0]['Youth ID'];
    },
  },

  methods: {
    parse(item) {
      return JSON.parse(JSON.stringify(item));
    },

    rowSelected(items) {
      this.selected = items;
    },

    async getHeaders() {
      let headers = await db
        .collection("GlobalFieldsCollection")
        .doc("Checked In")
        .get();
      headers = headers.data().fields;
      let fields = [];
      for (let i = 0; i < headers.length; i++) {
        fields.push({ key: Object.keys(headers[i])[0], sortable: true });
      }
      this.fields = fields;
    },

    async getTData() {
      rb.ref("Checked In").on("value", snapshot => {
        this.items = this.formatData(snapshot.val());
      });
    },

    formatData(data) {
      let ret = [];
      for (let key in data) {
        let items = data[key];
        items["Check In Time"] = moment(items["Check In Time"]).format(
          "MM/DD hh:mm a"
        );
        ret.push({
          ...{
            "Youth ID": key
          },
          ...items
        });
      }

      //format Check In Time to be a nicer string

      return ret;
    },

    toggleBusy() {
      this.isBusy = !this.isBusy;
    },
  },

  async mounted() {
    await this.getHeaders();
    await this.getTData();

    this.toggleBusy();
  }
};

</script>

<style>

.title {
margin-bottom: 1rem;
}

</style>
