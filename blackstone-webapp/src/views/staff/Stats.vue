<template>
    <div>
        <top-bar/>
        <b-container>
            <b-row><b-col><h1>Stats</h1></b-col></b-row>
            <b-row><b-col><h3>Attendance By Day</h3></b-col></b-row>
            <b-row>
                <b-col><DatePicker :lang="lang" v-model="datePicker_date"/></b-col>
                <b-col><b-button @click="lookupDailyAttendance">See attendance</b-button></b-col>
            </b-row>
            <br>
            <b-row><b-col>
                <p v-if="this.dailyAttendanceTableItems.length === 0">No Entries found</p>
                <b-table per-page="3" hover :items="dailyAttendanceTableItems"></b-table>
            </b-col></b-row>
                
        </b-container>
    

    </div>
    
</template>

<script>
import DatePicker from 'vue2-datepicker'
import moment from 'moment'
import { db } from '@/firebase.js'


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
                    date: 'Select a date',
                    dateRange: 'Select Date Range'
                }
            },
            datePicker_date: '',
            dailyAttendanceTableItems: [],
        }
    },
    methods: {
        async lookupDailyAttendance() {
            let unprocessed_profiles = await this.getDailyAttendace();
            this.dailyAttendanceTableItems = unprocessed_profiles;
            this.dailyAttendanceTableItems.forEach(entry => {
                entry["Check In"] = entry["Check In"].toDate();
                entry["Check Out"] = entry["Check Out"].toDate();
            })
            
        },

        // Private method
        async getDailyAttendace() {
            let start_Datetime = this.datePicker_date;
            let end_Datetime = moment(start_Datetime).add(1, 'days').toDate();
            let queryResult = {};
            try {
                queryResult = await db.collectionGroup("Work Log")
                    .where("Check In", '>' , start_Datetime)
                    .where("Check In", '<', end_Datetime)
                    .get();
            } catch (err) {
                console.log(err);
                window.alert(err)
            }
            let res = [];
            queryResult.forEach(doc => {
                res.push(doc.data())
            });
            return res;
        }

    },

    mounted() {

        

    }
    
}
</script>

<style>
.Special-input-demo {
    width: 50rem;
    margin: 0 auto;

}
</style>