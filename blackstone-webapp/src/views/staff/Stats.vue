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
    </div>
    
</template>

<script>
import DatePicker from 'vue2-datepicker'
import moment from 'moment'
export default {
    name: 'Stats',
    components: {
        DatePicker,
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
            date: moment().format("YYYY-MM-DD")
        }
    },
    methods: {
        handleSearchButtonClicked() {
            console.log(this.date);
        }
    }
    
}
</script>