<!--Values in this table are naturally reactive to changes to realtime database-->
<template>
  <div>
    <div class="content">
    <top-bar />
    <h1 class="title">Currently Checked-In Youth</h1>
    <PageHeader pageCategory="Staff Headers" pageName="Currently Checked In"></PageHeader>

    <b-button
      @click="viewProfile"
      style="margin-bottom: 1rem"
      variant="info"
    >View Profile</b-button>

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
    <b-modal v-model="viewProfileModalVisible" hide-footer lazy>
      <div ref="body_fields" v-show="currentProfile != null">
        <ProfileFields
          :profile="currentProfile"
          :headerDoc="header_doc"
          :periodData="period_data"
        />

        <br />
        <br />
      </div>
    </b-modal>
    </div>
    <Footer/>
  </div>
</template>

<script>
import { rb } from "../../firebase";
import { db } from "../../firebase";
import moment from "moment";
import ProfileFields from "@/components/ProfileFields.vue"
import ApronBar from "@/components/ApronBar.vue"
// import CollectionTable from "@/components/CollectionTable.vue"
import {Period} from "@/scripts/Period.js";
import {mapKeyVal} from "@/scripts/ParseDB.js";
import PageHeader from "@/components/PageHeader.vue"

let checkedInRef = rb.ref("Checked In");

export default {
  name: "CheckedIn",
  components: {
    ProfileFields,
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
      viewProfileModalVisible: false,
      currentProfile:null,
      header_doc: null,
      periods_db: db.collection("GlobalPeriods"),
      periods_doc: null,
      period_data: null,
      periods: [],
    };
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

    load_profile_data: async function() {
        this.periods_doc = await this.periods_db.doc("metadata").get();
        var data = this.periods_doc.data();

        await Period.setSeasons(data["Seasons"]);
        this.periods = Period.enumerateStr(data["CurrentPeriod"], data["FirstPeriod"]);

        this.period_data = {
          cur_period: data["CurrentPeriod"],
          reg_period: data["CurrentRegistrationPeriod"],
          seasons:    data["Seasons"],
          class_list: mapKeyVal(data["Classes"], (name, desc) => name),
        };
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

    async viewProfile() {
      let ID = this.selected[0]["Youth ID"];
      this.viewProfileModalVisible = true;
      let snapshot = db.collection("GlobalYouthProfile").doc(ID);
      this.currentProfile = await snapshot.get();
      console.log(this.currentProfile.data())
      // window.alert("This is an upcoming feature :) look forward to it!")
    }
  },

  async mounted() {
    await this.getHeaders();
    this.header_doc = await db.collection("GlobalFieldsCollection").doc("Youth Profile").get();

    await this.getTData();
    await this.load_profile_data();

    this.toggleBusy();
  }
};

</script>

<style>

.title {
margin-bottom: 1rem;
}

</style>
