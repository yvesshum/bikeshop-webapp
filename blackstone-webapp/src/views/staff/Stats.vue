// TODO: Add pagination
// Notes: 
// TODO: https://bootstrap-vue.js.org/docs/components/table/ Use show details for hours
// TODO: Grab peridos from `GlobalVariables` -> Seasons
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
                <b-table hover :items="dailyAttendanceTableItems"></b-table>
            </b-col></b-row>
            
            <br>

            <!-- Period Queries -->
            <!-- Hours Earned -->
            <b-row>
                <b-col>
                    <h3>Total Hours Earned by Period</h3>
                </b-col>
            </b-row>
            <br>
            <b-row>
                <b-col>
                    <b-form-select v-model="Earned_Period_Data.selected_year" :options="Earned_Period_Data.year_options"></b-form-select>    
                </b-col>
                <b-col>
                    <b-form-select v-model="Earned_Period_Data.selected_season" :options="Earned_Period_Data.season_options"></b-form-select>    
                </b-col>
                <b-col>
                    <b-button @click="handle_Total_Earned_By_Period_Search">Search</b-button>
                </b-col>
            </b-row>
            <br>
            <div v-if="total_Hours_Earned_Loading">
                <b-row>
                    <b-col>
                        <b-spinner type="grow"></b-spinner>
                    </b-col>
                </b-row>
                <b-row>
                    <b-col>
                        <strong>Doing some work...</strong>
                    </b-col>
                </b-row>
            </div>
            <b-row>
                <b-col>
                    <p v-if="this.total_Hours_Earned_Data.length === 0">No Entries found</p>
                    <b-table hover :items="total_Hours_Earned_Data"></b-table>
                </b-col>
            </b-row>
            <div v-if="this.total_Hours_Earned_Data.length !== 0">
                <b-row>
                    <b-col>
                        <h4>Totals:</h4>
                    </b-col>
                </b-row>
                <b-row>
                    <div v-for="category in Object.keys(total_Hours_Earned_Breakdown)" :key="category">
                        <b-col>
                            <p>{{category}}: {{total_Hours_Earned_Breakdown[category]}}</p>
                        </b-col>
                    </div>
                </b-row>
                <b-row><b-col>
                    <p>Total: {{total_Hours_Earned}}</p>    
                </b-col></b-row>
            </div>

            <!-- Hours Spent -->
            <b-row>
                <b-col>
                    <h3>Total Hours Spent by Period</h3>
                </b-col>
            </b-row>
            <br>
            <b-row>
                <b-col>
                    <b-form-select v-model="Spent_Period_Data.selected_year" :options="Spent_Period_Data.year_options"></b-form-select>    
                </b-col>
                <b-col>
                    <b-form-select v-model="Spent_Period_Data.selected_season" :options="Spent_Period_Data.season_options"></b-form-select>    
                </b-col>
                <b-col>
                    <b-button @click="handle_Total_Spent_By_Period_Search">Search</b-button>
                </b-col>
            </b-row>
            <br>
            <div v-if="total_Hours_Spent_Loading">
                <b-row>
                    <b-col>
                        <b-spinner type="grow"></b-spinner>
                    </b-col>
                </b-row>
                <b-row>
                    <b-col>
                        <strong>Doing some work...</strong>
                    </b-col>
                </b-row>
            </div>
            <b-row>
                <b-col>
                    <p v-if="this.total_Hours_Spent_Data.length === 0">No Entries found</p>
                    <b-table hover :items="total_Hours_Spent_Data"></b-table>
                </b-col>
            </b-row>
            <div v-if="this.total_Hours_Spent_Data.length !== 0">
                <p>Total: {{total_Hours_Spent}}</p>

            </div>
    
            
                
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

            Earned_Period_Data: {
                season_options: ['Spring', 'Summer', 'Fall'],
                year_options: [],
                selected_season: "",
                selected_year: ""
            },
            total_Hours_Earned_Data: [],
            total_Hours_Earned_Loading: false,
            total_Hours_Earned_Breakdown: {},
            total_Hours_Earned: 0,

            Spent_Period_Data: {
                season_options: ['Spring', 'Summer', 'Fall'],
                year_options: [],
                selected_season: "",
                selected_year: ""
            },
            total_Hours_Spent_Data: [],
            total_Hours_Spent_Loading: false,
            total_Hours_Spent: 0


        }
    },
    methods: {
        // Daily Attendace
        async lookupDailyAttendance() {
            let unprocessed_profiles = await this.getDailyAttendace();
            this.dailyAttendanceTableItems = unprocessed_profiles;
            this.dailyAttendanceTableItems.forEach(entry => {
                entry["Check In"] = entry["Check In"].toDate();
                entry["Check Out"] = entry["Check Out"].toDate();
            })
            
        },
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
        },

        // Total Hours Earned per quarter
        async handle_Total_Earned_By_Period_Search() {
            //reset
            this.total_Hours_Earned_Data = [];
            this.total_Hours_Earned_Loading = true;
            this.total_Hours_Earned_Breakdown = {};
            this.total_Hours_Earned = 0;

            let searchPeriod = this.Earned_Period_Data.selected_season + " " + this.Earned_Period_Data.selected_year.slice(2) //e.g. 2019 -> 19
            let query = {}
            try {
                query = await db.collectionGroup("Work Log")
                                .where("Period", '==', searchPeriod)
                                .get();
            } catch (err) { 
                console.log(err);
                window.alert(err);
            }
            query.forEach(doc => { 
                let data = doc.data();
                data["Check In"] = data["Check In"].toDate();
                data["Check Out"] = data["Check Out"].toDate();
                this.total_Hours_Earned_Data.push(data);
                // Append hours to breakdown
                for (let key in data) { 
                    // if a key is not a reserved keyword, then it is an hour logging category 
                    // this is just in case that an hour logging category name has changed
                    if (!['Check In', 'Check Out', 'First Name', 'Last Name', 'Notes', 'Period', 'Youth ID'].includes(key)) {
                        // undefined + 1 = 1, null + 2 = 2 etc. This takes care of initiation
                        if (this.total_Hours_Earned_Breakdown[key] == null) { 
                            this.total_Hours_Earned_Breakdown[key] = parseFloat(data[key])
                            this.total_Hours_Earned += parseFloat(data[key])
                        }
                        else {
                            this.total_Hours_Earned_Breakdown[key] += parseFloat(data[key])
                            this.total_Hours_Earned += parseFloat(data[key])
                        }
                        
                    }
                }
            })
            this.total_Hours_Earned_Loading = false;
        },

        // Total Hours Spent per quarter
        async handle_Total_Spent_By_Period_Search() {
            //reset
            this.total_Hours_Spent_Data = [];
            this.total_Hours_Spent_Loading = true;
            this.total_Hours_Spent = 0

            let searchPeriod = this.Spent_Period_Data.selected_season + " " + this.Spent_Period_Data.selected_year.slice(2) //e.g. 2019 -> 19
            let query = {}
            try {
                query = await db.collectionGroup("Order Log")
                                .where("Period", '==', searchPeriod)
                                .get();
            } catch (err) { 
                console.log(err);
                window.alert(err);
            }
            query.forEach(doc => { 
                let data = doc.data();
                data["Order Date"] = data["Order Date"].toDate();
                this.total_Hours_Spent_Data.push(data);
                // Append hours to total
                this.total_Hours_Spent += parseFloat(data["Item Total Cost"]);
            })
            this.total_Hours_Spent_Loading = false;
        }

    },

    mounted() {
        //Generate year selector 
        this.Earned_Period_Data.year_options.push("2019") //start point
        this.Spent_Period_Data.year_options.push("2019");
        let endPoint = moment().add(10, 'years').format("YYYY"); //end point of selector
        for (let years = 0; years < parseFloat(endPoint) - 2019; years ++) {
            let nextYear = 2019 + years + 1;
            this.Earned_Period_Data.year_options.push(nextYear.toString());
            this.Spent_Period_Data.year_options.push(nextYear.toString());
        }
        

    }
    
}
</script>

<style>
.Special-input-demo {
    width: 50rem;
    margin: 0 auto;

}
</style>