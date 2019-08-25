<!--
    

-->

<template>
    <div class="toggle_button">
        <b-button ref="button" :variant="variant" v-on:click="toggle" :block="block"></b-button>
    </div>
</template>

<script>
    export default {
        name: 'ToggleButton',
        props: ['onVariant', 'offVariant', 'onText', 'offText', 'block'],
        components: {},

        data: function () {
            return {
                active: false,
            };
        },

        computed: {
            variant: function() {
                if (this.active) {
                    return this.onVariant;
                } else {
                    return this.offVariant;
                };
            },
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