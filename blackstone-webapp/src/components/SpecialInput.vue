<!--
* Usage: <SpecialInput inputType="String" args="arguments" ref="specialInput1" tag="specialInput1" v-on:specialInput1="handleEmit"/>

* Input can be of types: Integer, Boolean, Phone, Date, Time, Gender, Race, Grade, Email

* Args must be an object. 
Some components have properties that we would like to set through Special Input.
To allow for this we add a property in the component below e.g. :placeholder="args.placeholder", 
To specify a property from the parent using args="arguments", one would just 
have to pass in an object with key=name_of_property value=value_of_property.
Like this in methods: 
arguments1: {
    "placeholder": "0",
    "align": "center"
    "style": "text-align:center; color: #FF0000"
}
If a property is not specified, "args.property_name" would just be undefined and all is well (I think). 
Style argument is just for the specific <b-form> components instead of the entire div

* The ref is only necessary if you want to call private methods here 
* tag is necessary to capture the data emission. The emit tag is specified as the tag prop.

* NOTE: In order to share a single value on three levels (the child input component, this current component, and the parent component), the input component uses v-model with the inner_value variable, and this component uses value to allow its parent to use v-model. Whenever one of these is changed, it updates the other.

-->

<template>
    <div v-if="ready">
        <!-- Returns an String that is an integer -->
        <div v-if="input === 'Integer'">
            <VueNumberInput 
              center
              v-model="value"
              :min="0"
              :step="1"
              placeholder="Hours"
              align="center"
              style="width: 20rem"
              controls
              :inputtable="false"
            />

        </div>

        <!-- Returns a string "true" or "false" -->
        <div v-else-if="input === 'Boolean'">
            <b-form-group >
                <b-form-radio-group  v-model="inner_value" name="Boolean">
                    <b-form-radio :value="true" :style="args.style">Yes</b-form-radio>
                    <b-form-radio :value="false" :style="args.style">No</b-form-radio>
                </b-form-radio-group>
            </b-form-group>

        </div>

        <!-- Returns a 10 digit string -->
        <div v-else-if="input === 'Phone'">
            <!-- <b-form-input v-model="value" type="text" :state="isValidPhoneNumber()" :style="args.style"></b-form-input> -->
            <vue-tel-input v-model="inner_value" v-bind:maxLen="14" v-bind:validCharactersOnly="true"></vue-tel-input>
        </div>

        <!-- Returns a ISO string-->
        <div v-else-if="input === 'Datetime'">
             <!-- <datetime format="YYYY-MM-DD H:i:s" width="100%" v-model="value"/> -->
             <!-- In progress, none of the packages seem to work so far -->     

    

        </div>

        <!-- Returns M/F or some string -->
        <div v-else-if="input === 'Gender'">
            <b-form-group >
                <b-form-radio-group  v-model="inner_value" name="Gender">
                    <b-form-radio value="M" :style="args.style">M</b-form-radio>
                    <b-form-radio value="F" :style="args.style">F</b-form-radio>
                    <b-form-radio value="Other" :style="args.style">Other</b-form-radio>
                </b-form-radio-group>
            </b-form-group>
        </div>

        <!-- Returns a string, possible options: 
            "Hispanic/Latino/Spanish Origin", 
            "American Indian/Alaskan Native", 
            "Asian", 
            "Native Hawaiian/Other Pacific Islander", 
            "Black or African American", 
            "White" -->
        <div v-else-if="input === 'Race'">
            <b-form-select v-model="inner_value" :options="raceOptions" :style="args.style"></b-form-select>
        </div>

        <!-- Returns 'K', '1,12' -->
        <div v-else-if="input === 'Grade'">
            <b-form-select v-model="inner_value" :options="gradeOptions" :style="args.style"></b-form-select>
        </div>

        <!-- Returns an email string -->
        <div v-else-if="input === 'Email'">
            <b-form-input v-model="inner_value" type="email" :state="isValidEmail()" :style="args.style"></b-form-input>
        </div>

        <!-- Returns a positive integer -->
        <div v-else-if="input === 'Hours'">
            <VueNumberInput 
              center
              v-model="inner_value"
              :min="0"
              :step="0.5"
              placeholder="Hours"
              align="center"
              style="width: 20rem"
              controls
              :inputtable="false"
            />
        </div>

        <!-- String Input -->
        <div v-else>
            <b-form-input v-model="inner_value" type="text" :style="args.style"></b-form-input>
        </div>


    </div>
</template>
<script>
import VueNumberInput from '@chenfengyuan/vue-number-input';
import { VueTelInput } from 'vue-tel-input'
import { Timestamp } from '@/firebase.js'


export default {
    name: 'SpecialInput',
    props: {
        inputType: {
            type: String,
            default: "String",
        },
        arguments: {    
            type: Object,
            default: function (){ return {} }
        },
        tag: {
            type:String,
            default: "unknown_ref"
        },
        value: {

        },
    },
    data() {
        return {
            input: null,
            inner_value: null,
            args: {},
            ready: false,
            raceOptions: [
                { value: null, text: 'Please select a race' },
                { value: "Hispanic/Latino/Spanish Origin", text: 'Hispanic or Latino or Spanish Origin of any race' },
                { value: "American Indian/Alaskan Native", text: 'American Indian or Alaskan Native' },
                { value: "Asian", text: 'Asian' },
                { value: "Native Hawaiian/Other Pacific Islander", text: 'Native Hawaiian/Other Pacific Islander' },
                { value: "Black or African American", text: 'Black or African American' },
                { value: "White", text: 'White' },
            ],
            gradeOptions: [
                { value: null, text: 'Please select a grade' },
                { value: "K", text: 'K' },
                { value: "1", text: '1' },
                { value: "2", text: '2' },
                { value: "3", text: '3' },
                { value: "4", text: '4' },
                { value: "5", text: '5' },
                { value: "6", text: '6' },
                { value: "7", text: '7' },
                { value: "8", text: '8' },
                { value: "9", text: '9' },
                { value: "10", text: '10' },
                { value: "11", text: '11' },
                { value: "12", text: '12' },
            ],
        }
    },

    watch: {

        // When the value is changed by the parent, update the inner_value for the input component
        value: function(new_value) {
            this.inner_value = new_value;
        },

        // When the inner value of the input component changes, propagate that change upward
        inner_value: function(new_value) {
            // this.$emit(this.tag, new_value);
            this.$emit("input", new_value);
        },

        // TODO: This function never actually runs if inputType is specified from the beginning, so I don't think we need it.
        inputType: function() {
            this.setValue(null);
            this.input = this.inputType;
        }
    },

    methods: {


        sanitizeArgs() {

        },

        setValue(val) {
            this.$emit("input", val);
            return;
        },

        initValue(val) {
            if (val != null) {
                this.setValue(val);
                return;
            }
            switch(this.input) {
                case 'Integer':
                    this.setValue(0);
                    break;
                case 'Boolean':
                    this.setValue("false");
                    break;
            }
        },

        isValidPhoneNumber() {
            return (this.value == null) ? false : (this.value.toString().length === 10 && !isNaN(this.value));
        },

        isValidEmail() {

            if (this.value == null) return false
            else {
                let data = this.value.split("@")

                return (data[0] != null && data[1] != null)
            }
            
        }
    },

    mounted() {
        this.sanitizeArgs();
        this.args = this.arguments;
        this.input = this.inputType;
        this.setValue(this.args.value);
        this.ready = true;
    },

    components: {
        VueTelInput,
        VueNumberInput,

    }

}
</script>
<style scoped>

</style>