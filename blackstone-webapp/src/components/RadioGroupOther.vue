<!--
Radio group style form component with a custom "other" option.

Usage:

    <RadioGroupOther v-model="value_variable" :options="['A', 'B', 'C']">
    </RadioGroupOther>

Props:

    value: Used with v-model.

    args: Arguments to be passed to the radio group.

    options: The list of radio options, not including "Other".

Use with v-model to track the value of this form component.

NOTE: The null option is assigned a value "undefined" so that when the component is first initialized with a null value, no radio will be selected. If it were to start as "null" instead, then on initialization, it would start out selected.
-->

<template>
    <div class="radio-group-other">
        <b-form-group style="text-align: left;">
            <b-form-radio-group v-model="choice" name="name" :options="options" stacked>

                <b-form-radio value="other" :style="args.style">
                    {{otherOption}}:<br />
                    <b-form-input v-model="other_value" value="" type="text"></b-form-input>
                </b-form-radio>

                <b-form-radio v-model="choice" :value="undefined" :style="args.style" v-if="show_null_option">
                    {{null_option_text}}
                </b-form-radio>
            </b-form-radio-group>

        </b-form-group>
    </div>
</template>
<script>


export default {
    name: 'RadioGroupOther',
    props: {
        value: {
            default: null,
        },
        args: {    
            type: Object,
            default: function () {return {};}
        },
        options: {
            type: Array,
            default: function () {return [];},
        },
        name: {
            type: String,
            default: "",
        },
        nullOption: {
            type: String,
            default: null,
        },
        otherOption: {
            type: String,
            default: "Other",
        },
    },

    data() {
        return {
            other_value: "",
            choice: null,

            use_other: false,
            use_null: false,
        }
    },

    mounted() {
        this.set_value(this.value);
    },

    watch: {
        value: function() {
            this.set_value(this.value);
        },

        choice: function() {
            this.emit_value();
        },

        other_value: function() {
            this.emit_value();
        },
    },

    computed: {
        null_option_text: function() {
            if (this.nullOption == null) {
                return "";
            }
            if (this.nullOption.length === 0) {
                return "Prefer not to say";
            }
            return this.nullOption;
        },

        show_null_option: function() {
            return this.nullOption != null;
        },
    },

    methods: {
        emit_value() {
            if (this.choice == "other") {
                this.$emit("input", this.other_value);
            }
            else {
                this.$emit("input", this.choice);
            }
        },

        set_value(new_val) {
            if (new_val == null) {
                this.choice = null;
            }
            else if (this.options.includes(new_val)) {
                this.choice = new_val;
            }
            else {
                this.choice = "other";
                this.other_val = new_val;
            }
        }
    },
}
</script>