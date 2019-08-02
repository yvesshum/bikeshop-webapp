<template>
    <div class = "bottom">
    <p class="center">Note: Changes to data should be made directly on firebase. We do not recommend doing this unless you absolutely have to.</p>

    </div>
</template>

<script>
export default {
    name: 'SettingsBottomNote'
}
</script>

<style>
.bottom {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 2.5rem;
    background: orange;
}
.center {
  margin: 0;
  position: absolute;
  top: 50%;
  left: 50%;
  -ms-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  width: 100%;
}
</style>