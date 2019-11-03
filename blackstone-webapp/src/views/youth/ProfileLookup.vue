<!--
Profile Lookup is a restricted version of Profile Lookup & Editing, located in staff pages.

This is still a work in progress, disregard this page for now.

-->

<template>
  <div class="profile_lookup_youth">
    <TopBar/>
    <p>This is the youth profile lookup page</p>

    <YouthIDSelector @selected="selectedID"/>

    <div ref="body_fields" style="display: none;">
      <ProfileFields :profile="currentProfile" :headerDoc="header_doc" :hideFields="hidden_fields" />

      <!-- <ApronBar /> -->

      <br /><br />

      <h2>Order Log</h2>
      <CollectionTable
        ref="order_log"
        :heading_data="order_log_headers"
        :collection="order_log_collection"
        groupBy="Period"
        :groupByOptions="periods"
        :progressiveLoad="true"
        style="width:90%;margin:auto;"
      ></CollectionTable>

      <br />

      <h2>Work Log</h2>
      <CollectionTable
        ref="work_log"
        :heading_data="work_log_headers"
        :collection="work_log_collection"
        groupBy="Period"
        :groupByOptions="periods"
        :progressiveLoad="true"
        style="width:90%;margin:auto;"
      ></CollectionTable>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import {db} from '../../firebase';
import {firebase} from '../../firebase';
import firebase_app from 'firebase/app';
import firebase_auth from 'firebase/auth';
import TopBar from '@/components/TopBar';
import YouthIDSelector from "@/components/YouthIDSelector.vue"
import ProfileFields from "@/components/ProfileFields.vue"
import ApronBar from "@/components/ApronBar.vue"
import CollectionTable from "@/components/CollectionTable.vue"

export default {
  name: 'profile_lookup_youth',
  components: {
    TopBar,
    YouthIDSelector,
    ProfileFields,
    ApronBar,
    CollectionTable
  },

  data: function() {
    return {
      currentProfile: null,
      order_log_collection: null,
      work_log_collection: null,
      header_doc: null,

      log_headers_doc: null,

      order_log_headers: [],
      work_log_headers: [],

      work_log_headers_omit: ["First Name", "Last Name", "Youth ID"],

      periods: [],

      hidden_fields: ["Demerits"],
    };
  },

  mounted: async function() {
    this.header_doc = await db.collection("GlobalFieldsCollection").doc("Youth Profile").get();
    this.log_headers_doc = await db.collection("GlobalFieldsCollection").doc("Log Table Headers").get();

    this.order_log_headers = this.log_headers_doc.data()['Order Log Headers'];
    this.work_log_headers = this.log_headers_doc.data()['Work Log Headers'].filter(header => {
      return !this.work_log_headers_omit.includes(header);
    });

    let periods_doc = await db.collection("GlobalVariables").doc("ActivePeriods").get();
    let periods_data = periods_doc.data();
    this.periods = [periods_data["CurrentPeriod"], ...periods_data["PastPeriods"]];
  },

  methods: {

    selectedID: async function({ ID: id }) {

      // No id returned - clear the page
      if (id == null) {
        this.load_none();
      }

      // Id returned - load profile for that youth
      else {
        this.$refs.body_fields.style.display = "";

        id = id.slice(id.lastIndexOf(' ')+1);
        let snapshot = db.collection("GlobalYouthProfile").doc(id);

        this.currentProfile = await snapshot.get();
        this.order_log_collection = snapshot.collection("Order Log");
        this.work_log_collection  = snapshot.collection("Work Log");
      }
    },

    load_none: function() {
      this.$refs.body_fields.style.display = "none";
      this.currentProfile = null;
      this.order_log_collection = null;
      this.work_log_collection  = null;
    },
  }
}
</script>