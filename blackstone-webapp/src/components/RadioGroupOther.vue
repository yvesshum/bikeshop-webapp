<!--
Radio group style form component with a custom "other" option.

Usage:

    <RadioGroupOther v-model="value_variable" :options="['A', 'B', 'C']" nullOption>
    </RadioGroupOther>

Props:

    value: Used with v-model.

    args: Arguments to be passed to the radio group.

    options: The list of radio options, not including "Other".

    name: The name of the b form radio group.

    nullOption: Control the null option:

        If this prop is omitted, there will be no null option.
        <RadioGroupOther></RadioGroupOther>

        If this prop is included but not assigned a value (or assigned an empty string), there will be a null option with the default text, "Prefer not to say".
        <RadioGroupOther nullOption></RadioGroupOther>

        If this prop is assigned a value, there will be a null option with the provided text.
        <RadioGroupOther nullOption="None of the above."></RadioGroupOther>

    otherOption: The text to display for the custom option. Defaults to "Other".

Use with v-model to track the value of this form component.

NOTE: The null option is assigned a value "undefined" so that when the component is first initialized with a null value, no radio will be selected. If it were to start as "null" instead, then on initialization, it would start out selected.
-->

<template>
    <div class="radio-group-other">
        <b-form-group style="text-align: left;">
            <b-form-radio-group v-model="choice" :name="name" :options="options" stacked>

                <b-form-radio :value="other_string" :style="args.style" v-if="show_other_option">
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
        omitOtherOption: {
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

            other_string: "",
        }
    },

    mounted() {
        this.other_string = this.gen_other_string();
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
        
        show_other_option: function() {
            return this.omitOtherOption == null;
        },
    },

    methods: {
        emit_value() {
            if (this.choice == this.other_string) {
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
                this.choice = this.other_string;
                this.other_val = new_val;
            }
        },

        // TODO: Maybe something a bit more sophisticated then just brute forcing underscores onto the end until it works? Granted, I can't imagine a situation where the user would want a bunch of radio options that are just "Other" with increasing numbers of underscores, but this still feels... *dirty* somehow
        gen_other_string() {
            let str = "Other";
            while (this.options.includes(str)) {
                str += "_";
            }
            return str;
        },
    },
}
</script>