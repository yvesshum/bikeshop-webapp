<!--
* Usage: <SpecialInput input="String" args="arguments" ref="specialInput1"/>

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

* The ref is so that we can call the .get method for the value later on.
`this.$refs.specialInput1.get()` This returns whatever value it is
-->

<template>
    <div v-if="ready">
        <!-- Returns an String that is an integer -->
        <div v-if="input === 'Integer'">
            <VueNumericInput
                v-model="value"
                :step="1"
                :placeholder="args.placeholder"
                :align="args.align"
                :precision="args.precision"
                :style="args.style"
            />

        </div>

        <!-- Returns a string "true" or "false" -->
        <div v-else-if="input === 'Boolean'">
            <b-form-group >
                <b-form-radio-group  v-model="value" name="radio-sub-component">
                    <b-form-radio :value="true" :style="args.style">Yes</b-form-radio>
                    <b-form-radio :value="false" :style="args.style">No</b-form-radio>
                </b-form-radio-group>
            </b-form-group>

        </div>

        <!-- Returns a 10 digit string -->
        <div v-else-if="input === 'Phone'">
            <b-form-input v-model="value" type="text" :state="isValidPhoneNumber()" :style="args.style"></b-form-input>
        </div>

        <!-- Returns a string "YYYY-MM-DD"-->
        <div v-else-if="input === 'Date'">
            <b-form-input v-model="value" type="date" :style="args.style"></b-form-input>
        </div>

        <!-- Returns a time "hh:mm" in 24 hour format -->
        <div v-else-if="input === 'Time'">
            <b-form-input v-model="value" type="time" :style="args.style"></b-form-input>   
        </div>

        <!-- Returns M/F or some string -->
        <div v-else-if="input === 'Gender'">
            <b-form-group >
                <b-form-radio-group  v-model="value" name="radio-sub-component">
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
            <b-form-select v-model="value" :options="raceOptions" :style="args.style"></b-form-select>
        </div>

        <!-- Returns 'K', '1,12' -->
        <div v-else-if="input === 'Grade'">
            <b-form-select v-model="value" :options="gradeOptions" :style="args.style"></b-form-select>
        </div>

        <!-- Returns an email string -->
        <div v-else-if="input === 'Email'">
            <b-form-input v-model="value" type="email" :state="isValidEmail()" :style="args.style"></b-form-input> 
        </div>

        <div v-else>
            <b-form-input v-model="value" type="text" :style="args.style"></b-form-input> 
        </div>


    </div>
</template>
<script>
import VueNumericInput from 'vue-numeric-input';


export default {
    name: 'SpecialInput',
    props: {
        input: {
            type: String,
            default: "String",
        },
        arguments: {    
            type: Object,
            default: {}
        }
    },
    data() {
        return {
            value: null,
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
                { value: "12", text: '12    ' },

            ]
        }
    },

    watch: {
        value: function() {
            this.$emit("input", this.value)
        },
    },

    methods: {
        get() {
            return this.value;
        },
        sanitizeArgs() {

        },

        setValue(val) {
            if (val != null) {
                this.value = val;
                return;
            }
            switch(this.input) {
                case 'Integer':
                    this.value = 0
                    break;
                case 'Boolean':
                    this.value = "false"
                    break;
            }
        },

        isValidPhoneNumber() {
            return (this.value == null) ? false : (this.value.toString().length === 10 && !isNaN(this.value));
        },

        isValidEmail() {
            console.log(this.value);
            if (this.value == null) return false
            else {
                let data = this.value.split("@")
                console.log(data)
                return (data[0] != null && data[1] != null)
            }
            
        }
    },

    mounted() {
        this.sanitizeArgs();
        this.args = this.arguments;
        this.setValue(this.args.value);
        this.ready = true;
    },

    components: {
        VueNumericInput,

    }

}
</script>
<style scoped>

</style>