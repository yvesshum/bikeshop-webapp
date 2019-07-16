<template>
  <div class="profile_lookup_staff">
    <TopBar/>
    <p>This is the staff view of the youth profile lookup page</p>
    <YouthIDSelector @selected="selectedID"/>
    <ProfileFields :current-profile="currentProfile" />
    <!-- <ApronBar /> -->
    <ProfileItemLogs />
    <button @click="logout">Logout</button>
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
import ProfileItemLogs from "@/components/ProfileItemLogs.vue"

export default {
  name: 'profile_lookup_youth',
  components: {
    TopBar,
    YouthIDSelector,
    ProfileFields,
    ApronBar,
    ProfileItemLogs
  },

  data: function() {
    return {
      currentProfile: null
    };
  },

    methods: {

      selectedID: async function(id) {
        id = id.slice(id.lastIndexOf(' ')+1);
        this.currentProfile = await db.collection("GlobalYouthProfile").doc(id).get();
      },

      logout: function() {
          firebase_app.auth().signOut().then(() => {
              this.$router.replace('login');
          });
      }
    }
}
</script>