<!--
* Usage: <SpecialInput inputType="String" :arguments="args" v-model="specialInputvalue"/>

* Input can be of types: Integer, Boolean, Phone, Date, Time, Gender, Race....
        The full list can be viewed in GlobalVariables/SpecialInput 

* Args must be an object. 

Some components have properties that we would like to set through Special Input.

To allow for this we can add a property in the component below e.g. :placeholder="arguments.placeholder", 

To specify a property from the parent using :arguments="args", one would just 
have to pass in an object with key=name_of_property value=value_of_property.

Like this in methods: 
args: {
    "placeholder": "0",
    "align": "center"
    "style": "text-align:center; color: #FF0000"
}

Note that if a property is not specified, "arguments.property_name" would just be undefined and all is well (I think). 
Style argument is just for the specific <b-form> components instead of the entire div

* The ref is only necessary if you want to call private methods here 


* NOTE: In order to share a single value on three levels (the child input component, 
this current component, and the parent component), the input component uses v-model 
with the inner_value variable, and this component uses value to allow its parent to 
use v-model. Whenever one of these is changed, it updates the other.

-->

<template>
    <div v-if="ready">
        <!-- Returns an String that is an integer -->
        <div v-if="input === 'Integer'">
            <VueNumberInput 
              center
              v-model="inner_value"
              :min="0"
              :step="1"
              align="center"
              style="width: 20rem"
              controls
              :inputtable="false"
            />

        </div>

        <!-- Returns a string "true" or "false" -->
        <div v-else-if="input === 'Boolean'">
            <b-form-group >
                <b-form-radio-group  v-model="inner_value">
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
            <datetime type="datetime" v-model="inner_value"/>

        </div>
        
        <div v-else-if="input === 'Date'" style="text-align: center;">
            <datepicker v-model="inner_value" style="display: inline-block;"></datepicker>
        </div>

        <!-- Returns M/F or some string -->
        <div v-else-if="input === 'Gender'">
            <b-form-group >
                <b-form-radio-group  v-model="inner_value" :name="inner_value">
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
              style="width: 100%; margin: 0 auto"
              controls
              :inputtable="false"
            />
        </div>

        <div v-else-if="input === 'Class'">
            <b-form-select v-model="inner_value" :options="classOptions" :style="args.style"></b-form-select>
        </div>

        <div v-else-if="input === 'Period'">
            <b-form-select v-model="inner_value" :options="periodOptions" :style="args.style"></b-form-select>
        </div>

        <!-- String Input -->
        <div v-else>
            <b-form-input v-model="inner_value" type="text" :style="args.style" :placeholder="args.placeholder"></b-form-input>
        </div>


    </div>
</template>
<script>
import VueNumberInput from '@chenfengyuan/vue-number-input';
import { VueTelInput } from 'vue-tel-input'
import { Timestamp } from '@/firebase.js'
import {db} from '@/firebase.js'
import moment from 'moment'
import { Datetime } from 'vue-datetime'
import 'vue-datetime/dist/vue-datetime.css'
import Datepicker from 'vuejs-datepicker';

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
            classOptions: [{value: null, text: "Please wait, fetching.."}],
            periodOptions: [{value: null, text: "Please wait, fetching.."}],
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
            //check input type 
            // if match, parse into Timestamp 
            if (this.inputType === "Datetime" || this.inputType === "Date") {
                this.$emit("input", Timestamp.fromDate(new Date(new_value)));
            }
            else {
                this.$emit("input", new_value);
            }
            
        },

        inputType: function() {
            this.input = this.inputType;
            if (this.inputType === "Class" && this.classOptions[0].value == null) {
                //only get it once, avoid api spam
                this.getClassOptions();
            }
            else if (this.inputType === "Period" && this.periodOptions[0].value == null) {
                //only get it once, avoid api spam
                this.getPeriodOptions();
            }
            this.initValue();
            
        }
    },

    methods: {


        sanitizeArgs() {

        },

        setValue(val) {
            console.log('val', val);
            this.inner_value = val;
        },

        //defaults 
        initValue(val) {
            console.log("init value called, input type:", this.input);
            if (val != null) {
                this.setValue(val);
                return;
            }
            switch(this.input) {
                case 'Integer':
                    this.setValue(0);
                    break;
                case 'Boolean':
                    this.setValue(false);
                    break;
                case 'Phone': 
                    this.setValue("");
                    break;
                case 'Datetime':
                    this.setValue(new Date().toString())
                    break;
                case 'Date':
                    this.setValue(new Date())
                    break;
                case 'Gender':
                    this.setValue("M"); //leftmost element 
                    break;
                case 'Race': 
                    this.setValue(null);
                    break;
                case 'Grade':
                    this.setValue(null);
                    break;
                case 'Email':
                    this.setValue("");
                    break;
                case 'Hours':
                    this.setValue(0);
                    break;
                case 'Class':
                    this.setValue(this.classOptions[0].value);
                    break;
                case 'Period':
                    this.setValue(this.periodOptions[0].value);
                    break;
                default:
                    this.setValue("");
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
            
        },

        async getClassOptions() {
            let query = await db.collection("GlobalPeriods").doc("metadata").get();
            this.classOptions = [];
            // { value: "12", text: '12' },
            let classes = query.data().Classes
            console.log(classes);
            classes.forEach(c => {
                this.classOptions.push({
                    value: Object.keys(c)[0],
                    text: Object.keys(c)[0] + ": " + Object.values(c)[0]
                })
            })
        },

        async getPeriodOptions() {
            let seasons = await db.collection("GlobalPeriods").doc("metadata").get();
            this.periodOptions = [];
            seasons = seasons.data().Seasons;
            console.log('sget', seasons);
            let years = [];
            years.push(moment().subtract(1, 'years').format("YY"));
            years.push(moment().format("YY"));
            years.push(moment().add(1, 'years').format("YY"));
            years.forEach(year => {
                seasons.forEach(season => {
                    this.periodOptions.push({
                        value: season + " " + year,
                        text: season + " " + year
                    })
                })
            })

        }
    },

    async mounted() {
        this.sanitizeArgs();
        this.args = this.arguments;
        this.input = this.inputType;
        this.setValue(this.args.value);

        //get Class data 
        if (this.input === "Class") {
            await this.getClassOptions();
        }

        if (this.input ==="Period") {
            await this.getPeriodOptions();
        }

        this.ready = true;
    },

    components: {
        VueTelInput,
        VueNumberInput,
        Datetime,
        Datepicker
    }

}
</script>
<style scoped>

</style>
