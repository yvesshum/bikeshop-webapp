<template>
  <div class="apron_bar" style="border-style: solid; border-width: 5px;">
    <p>This is where the apron bar goes!</p>
    
    <div id="apron_container">
      <div id="apron_bar"></div>
      <canvas id="apron_pointer" width="64" height="32"></canvas>
    </div>

  </div>
</template>

<script>
// @ is an alias to /src
import firebase_app from 'firebase/app';
import firebase_auth from 'firebase/auth';

export default {
  name: 'apron_bar',
  components: {
    
  },
  methods: {
    
  }
}
</script>