<template>
    <div class = "bottom">
    <p class="center">Note: Changes to data can be made directly on firebase. But we really do not recommend editing on firebase directly unless you absolutely have to.</p>
 
    </div>
</template>
 
<script>
export default {
    name: 'SettingsBottomNote'
}
</script>
 
<style>
.bottom {
    bottom: 0;
    width: 100%;
    height: 2.5rem;
    background:orangered ;
    margin-top: 5%;
}
.center {
  margin: 0;
  position: relative;
  top: 50%;
  left: 50%;
  -ms-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  width: 100%;
}
</style>