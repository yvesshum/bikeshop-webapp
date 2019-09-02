<!--
A b-button component which handles toggling between active and inactive automatically.

Usage:

    <ToggleButton
        v-model="var_to_toggle"
        onVariant="success" offVariant="primary"
        :onText="this.onText" :offText="this.offText"
        :switchOn="this.on_function" :switchOff="this.off_function"
        block
    ></ToggleButton>


Props:

    onVariant - The b-button variant to use when the button is active. This is passed directly to the b-button, so it defaults to the b-button default, "secondary".

    offVariant - The b-button variant to use when the button is inactive. This is passed directly to the b-button, so it defaults to the b-button default, "secondary".

    onText - The message to display when the button is active, if not using slots (see below).

    offText - The message to display when the button is inactive, if not using slots (see below).

    block - Whether to display the b-button in block mode. To use, simply include "block" in the tag, as you would for a regular b-button.

    switchOn - A function to be run before switching the button to the active state. Returns:

        True: Proceed to switch the button to active.
        False: Do not switch the button to active.

    switchOff - A function to be run before switching the button to the inactive state. Returns:

        True: Proceed to switch the button to active.
        False: Do not switch the button to active.


Emits:

    Toggle - The new state of the button after it successfully changes state due to being clicked.

        Note that "Toggle" is only emitted when the button itself is clicked - if its state is manually set by the parent by changing the "value" prop or with the set_active method, "Toggle" will not be emitted.


Slot Mode:

    To display the active and/or inactive content with slots rather than string props, simply use Vue slots with the names "onText" or "offText", eg:

    <ToggleButton>
        <template slot="onText">Some content to display when the button is active.</template>
        <template slot="offText">This content can be <em>formatted</em>.</template>
    </ToggleButton>

    Slot mode allows much more customization of the button content, since the button can render HTML objects instead of just plain text.

    Note that slots may be used to render both the active and inactive content, or just one (with the other provided in the "onText" or "offText" prop).


Switch Functions:

    By providing functions to switchOn and switchOff, more nuanced decisions can be made about switching the button on and off. Note that these default to:

        function() {return true;}

    ...meaning that, if either one is not provided, the ToggleButton will simply switch states when clicked.  If you want to do something after the button's state is switched, the button will emit "Toggle" along with its new state after a successful switch. Note that "Toggle" is only emitted when the button itself is clicked - if its state is manually set by the parent by changing the "value" prop or with the set_active method, "Toggle" will not be emitted.

    Note: Providing a function that just returns `false` and does nothing else will prevent the button from changing at all when it is clicked.  This is probably not what you want, but I suppose I can't know that for sure.
-->

<template>
    <b-button ref="button" :variant="variant" v-on:click="toggle" :block="block">
        <slot name="onText" v-if="value">{{text}}</slot>
        <slot name="offText" v-else>{{text}}</slot>
    </b-button>
</template>

<script>
    export default {
        name: 'ToggleButton',
        props: {
            onVariant: String,
            offVariant: String,
            onText: String,
            offText: String,
            block: {
                default: false,
            },
            value: {
                default: false,
            },
            switchOn: {
                type: Function,
                default: function() {return true;},
            },
            switchOff: {
                type: Function,
                default: function() {return true;},
            },
        },

        data: function() {
            return {
                // The state of the button. If a value prop is provided, always mimics that; if not, allows the button to maintain its own internal state.
                active: this.value,
            }
        },

        mounted: function() {
            this.$emit("Mounted", this);
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

        watch: {
            // If tracking a v-model value, keep active up to date with it
            value: function(new_val) {
                this.active = new_val;
            },
        },

        methods: {
            // Toggle the button's current state and emit the new value
            toggle: function() {
                if (this.active) {
                    if (this.switchOff()) {
                        this.$emit("input", false);
                        this.$emit("Toggle", false);
                    }
                }
                else {
                    if (this.switchOn()) {
                        this.$emit("input", true);
                        this.$emit("Toggle", true);
                    }
                }
            },

            // Manually set the button's state
            // Sets "active" directly in case the button does not track a "value" prop
            set_active: function(new_val) {
                this.active = new_val;
                this.$emit("input", new_val);
            },
        },
    }
</script>