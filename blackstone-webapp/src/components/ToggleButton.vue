<!--
    

-->

<template>
    <div class="toggle_button">
        <slot><button ref="button" v-on:click="toggle"></button></slot>
    </div>
</template>

<script>
    export default {
        name: 'ToggleButton',
        props: ['onText', 'offText'],
        components: {},

        data: function () {
            return {
                active: false,
            };
        },

        mounted: function() {
            if (this.$refs.button == null) {
                console.log("No button found in ToggleButton");
            } else {
                this.$refs.button.innerHTML = this.offText;
            };
        },

        methods: {
            toggle: function() {
                this.active = !this.active;
                this.$refs.button.innerHTML = (this.active) ? this.onText : this.offText;
                this.$emit("Toggle", this.active);
            }
        },
    }
</script>