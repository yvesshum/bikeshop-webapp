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
import firebase_app from 'firebase/app';
import firebase_auth from 'firebase/auth';

export default {
  name: 'profile_item_logs',
  components: {
    
  },
  methods: {
    
  }
}
</script>