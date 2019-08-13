<template>
  <div class="profile_lookup_youth">
    <TopBar/>
    <p>This is the youth profile lookup page</p>
    <!-- <YouthIDSelector /> -->
    <ProfileFields />
    <ApronBar />
    <ProfileItemLogs />
  </div>
</template>

<script>
// @ is an alias to /src
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
    methods: {
      
    }
}
</script>