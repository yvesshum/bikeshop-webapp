<template>
    <div>
        <top-bar/>
        <b-container>
            <b-row><b-col><h1>Stats</h1></b-col></b-row>
            <b-row><b-col><h3>Attendance By Day</h3></b-col></b-row>
            <b-row>
                <b-col><DatePicker :lang="lang" v-model="date"/></b-col>
                <b-col><b-button @click="handleSearchButtonClicked">Search</b-button></b-col>
            </b-row>
        </b-container>
        <div class="Special-input-demo">
            <p>Integer</p>
            <SpecialInput input="Integer" ref='test2' :arguments="arguments1" />
            <br>

            <p>Boolean</p>
            <SpecialInput input="Boolean" ref="test" :arguments="arguments1" />
            <br>

            <p>Phone</p>
            <SpecialInput input="Phone" ref="phone" :arguments="{}"/>
            <br>

            <p>Date</p>
            <SpecialInput input="Date" ref="date" :arguments="{}"/>
            <br>

            <p>Time</p>
            <SpecialInput input="Time" ref="time"  :arguments="{}"/>
            <br>

            <p>Gender</p>
            <SpecialInput input="Gender" ref="gender"  :arguments="{}"/>
            <br>

            <p>Race</p>
            <SpecialInput input="Race" ref="race"  :arguments="{}"/>
            <br>

            <p>Grade</p>
            <SpecialInput input="Grade" ref="race"  :arguments="{}"/>
            <br>

            <p>Email</p>
            <SpecialInput input="Email" ref="race"  :arguments="{}"/>
            <br>

            <p>Anything else</p>
            <SpecialInput input="someweirdtext" ref="race"  :arguments="{}"/>
            <br>
        </div>
    </div>
    
</template>

<script>
import DatePicker from 'vue2-datepicker'
import moment from 'moment'
import SpecialInput from '../../components/SpecialInput.vue'

export default {
    name: 'Stats',
    components: {
        DatePicker,
        SpecialInput
    },
    data() {
        return {
            lang: {
                days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                pickers: ['next 7 days', 'next 30 days', 'previous 7 days', 'previous 30 days'],
                placeholder: {
                    date: moment().format("YYYY-MM-DD"),
                    dateRange: 'Select Date Range'
                }
            },
            date: moment().format("YYYY-MM-DD"),
            arguments1: {
                "placeholder": "0",
            }
        }
    },
    methods: {
        handleSearchButtonClicked() {
            console.log(this.date);
            console.log('phone:', typeof(this.$refs.phone.get()))
        }
    },

    mounted() {
        console.log('type:', typeof(this.$refs.test2.get()))
        

    }
    
}
</script>

<style>
.Special-input-demo {
    width: 50rem;
    margin: 0 auto;

}
</style>