<template>
  <div class="profile_fields" style="border-style: solid; border-width: 5px;">
    <p>This is where the basic fields go!</p>
    
    <p id="Name_field" class="data_field" style="background-color: papayawhip;"></p>
    <p id="DOB_field" class="data_field" style="background-color: papayawhip;"></p>
    <p id="Hair_Color_field" class="data_field" style="background-color: papayawhip;"></p>
    <div id="variable_fields"></div>

  </div>
</template>

<script>
// @ is an alias to /src
import firebase_app from 'firebase/app';
import firebase_auth from 'firebase/auth';

export default {
  name: 'profile_fields',
  components: {
    
  },
  methods: {
    
  }
}
</script>