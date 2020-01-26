<template>
  <div class="profile_lookup_staff">
    <TopBar/>
    <p>This is the staff view of the youth profile lookup page</p>

    <YouthIDSelector @selected="load_youth"/>
    <br />

    <div ref="body_fields" v-show="currentProfile != null">
      <ProfileFields :profile="currentProfile" :headerDoc="header_doc" :periodData="period_data" edit showOptionalFields />

      <br />

      <ApronBar :profile="currentProfile" />

      <br /><br />

      <ProfileItemLogs
        :snapshot="profile_snapshot"
        :periods="periods"
        :visible="currentProfile != null"
      ></ProfileItemLogs>

      <br /><br />
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
import ProfileItemLogs from "@/components/ProfileItemLogs.vue";
import {Period} from "@/scripts/Period.js";
import {mapKeyVal} from "@/scripts/ParseDB.js";

export default {
  name: 'profile_lookup_youth',
  components: {
    TopBar,
    YouthIDSelector,
    ProfileFields,
    ApronBar,
    ProfileItemLogs,
  },

  data: function() {
    return {
      currentProfile: null,
      profile_snapshot: null,
      header_doc: null,

      periods_db: db.collection("GlobalPeriods"),
      periods_doc: null,
      period_data: null,
      periods: [],
    };
  },

  mounted: async function() {
    this.header_doc = await db.collection("GlobalFieldsCollection").doc("Youth Profile").get();

    await this.load_profile_data();
  },

    methods: {

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

      load_youth: async function(youth) {

        // No id returned - clear the page
        if (youth == null) {
          this.profile_snapshot = null;
          this.currentProfile = null;
        }

        // Id returned - load profile for that youth
        else {
          this.profile_snapshot = db.collection("GlobalYouthProfile").doc(youth.ID);
          this.currentProfile = await this.profile_snapshot.get();
        }
      },
    }
}
</script>