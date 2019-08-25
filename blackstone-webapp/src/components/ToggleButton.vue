<!--
A b-button component which handles toggling between active and inactive automatically.

Usage:

    <ToggleButton
        onVariant="success" offVariant="primary"
        :onText="this.onText" :offText="this.offText"
        @Toggle="toggle_edit_mode"
        slots block
    ></ToggleButton>


Props:

    onVariant - The b-button variant to use when the button is active. This is passed directly to the b-button, so it defaults to the b-button default, "secondary".

    offVariant - The b-button variant to use when the button is inactive. This is passed directly to the b-button, so it defaults to the b-button default, "secondary".

    onText - The message to display when the button is active, if not using slots (see below).

    offText - The message to display when the button is inactive, if not using slots (see below).

    slots - Whether to display the button in slot mode:

        To use slot mode, simply include "slots" in the tag:
        <ToggleButton [...] slots></ToggleButton>

        If "slots" is not included, slot mode will not be used.

    block - Whether to display the b-button in block mode. To use, simply include "block" in the tag, as you would for a regular b-button.


Emits:

    Toggle - The new state of the button whenever it is clicked.


Slot Mode:

    When displaying in slot mode, the active/inactive content should instead be passed using two Vue slots named "onText" and "offText", eg:

    <ToggleButton ... slots>
        <template slot="onText">Some content to display when the button is active.</template>
        <template slot="offText">This content can be <em>formatted</em>.</template>
    </ToggleButton>

    Slot mode allows much more customization of the button content, since the button can render HTML objects instead of just plain text.
-->

<template>
    <div class="toggle_button">
        <b-button ref="button" :variant="variant" v-on:click="toggle" :block="block">
            <div v-if="slots!=undefined">
                <slot name="onText" v-if="this.active"></slot>
                <slot name="offText" v-else></slot>
            </div>
            <div v-else>
                {{text}}
            </div>
        </b-button>
    </div>
</template>

<script>
    export default {
        name: 'ToggleButton',
        props: ['onVariant', 'offVariant', 'onText', 'offText', 'slots', 'block'],
        components: {},

        data: function () {
            return {
                // The state of the button
                active: false,
            };
        },

        computed: {
            // The current b-button variant to use
            variant: function() {
                return (this.active) ? this.onVariant : this.offVariant;
            },

            // The current text to display (non-slot mode)
            text: function() {
                return (this.active) ? this.onText : this.offText;
            },
        },

        methods: {
            // Toggle the button's current state and emit the new value
            toggle: function() {
                this.active = !this.active;
                this.$emit("Toggle", this.active);
            }
        },
    }
</script>