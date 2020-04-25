// TODO: Add pagination
<template>
    <div>
        <top-bar />
        <b-container>
            <b-row>
                <b-col>
                    <h1>Stats</h1>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <h3 v-b-tooltip.hover title="Queries by Check In Date">Attendance By Day</h3>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    <Datetime auto v-model="datePicker_date" value-zone="America/Chicago" />
                </b-col>
                <b-col>
                    <b-button @click="lookupDailyAttendance">See attendance</b-button>
                </b-col>
            </b-row>

            <br />

            <b-row>
                <b-col>
                    <p v-if="this.dailyAttendanceTableItems.length === 0">No Entries found</p>
                    <b-table hover :items="dailyAttendanceTableItems"></b-table>
                </b-col>
            </b-row>

            <br />

            <!-- Period Queries -->
            <!-- Hours Earned -->
            <b-row>
                <b-col>
                    <h3>Total Hours Earned by Period</h3>
                </b-col>
            </b-row>
            <br />
            <b-row>
                <b-col>
                    <b-form-select
                        v-model="Earned_Period_Data.selected_year"
                        :options="Earned_Period_Data.year_options"
                    ></b-form-select>
                </b-col>
                <b-col>
                    <b-form-select
                        v-model="Earned_Period_Data.selected_season"
                        :options="Earned_Period_Data.season_options"
                    ></b-form-select>
                </b-col>
                <b-col>
                    <b-button @click="handle_Total_Earned_By_Period_Search">Search</b-button>
                </b-col>
            </b-row>
            <br />
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
                    <div>
                        <p v-if="this.total_Hours_Earned_Data.length === 0">No Entries found</p>
                        <b-table
                            hover
                            :items="total_Hours_Earned_Data"
                            :fields="earned_Table_Fields"
                            sort-by="Check In"
                            responsive="sm"
                        >
                            <template v-slot:cell(show_details)="row">
                                <b-button
                                    size="sm"
                                    @click="row.toggleDetails"
                                    class="mr-2"
                                >{{ row.detailsShowing ? 'Hide' : 'Show'}} Details</b-button>
                            </template>
                            <template v-slot:row-details="row">
                                <b-card>
                                    <!-- since `item` is an object, we need to do Object.keys()[0] to get a string key -->
                                    <div
                                        v-for="item in excludeEarnedTableHeaders(row.item)"
                                        :key="Object.keys(item)[0]"
                                    >
                                        <b-row class="mb-2">
                                            <b-col sm="3" class="text-sm-right">
                                                <b>{{Object.keys(item)[0]}}</b>
                                            </b-col>
                                            <b-col>{{Object.values(item)[0]}}</b-col>
                                        </b-row>
                                    </div>
                                    <b-button size="sm" @click="row.toggleDetails">Hide Details</b-button>
                                </b-card>
                            </template>
                            <template v-slot:cell(total_hours)="hoursRow">{{getSubtotalHours(hoursRow.item)}}</template>
                        </b-table>
                    </div>
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
                <b-row>
                    <b-col>
                        <p>Total: {{total_Hours_Earned}}</p>
                    </b-col>
                </b-row>
            </div>

            <!-- Hours Spent -->
            <b-row>
                <b-col>
                    <h3>Total Hours Spent by Period</h3>
                </b-col>
            </b-row>
            <br />
            <b-row>
                <b-col>
                    <b-form-select
                        v-model="Spent_Period_Data.selected_year"
                        :options="Spent_Period_Data.year_options"
                    ></b-form-select>
                </b-col>
                <b-col>
                    <b-form-select
                        v-model="Spent_Period_Data.selected_season"
                        :options="Spent_Period_Data.season_options"
                    ></b-form-select>
                </b-col>
                <b-col>
                    <b-button @click="handle_Total_Spent_By_Period_Search">Search</b-button>
                </b-col>
            </b-row>
            <br />
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
            <b-row>
                <b-col>
                    <h3>Query All User Data</h3>
                    <br />
                    <b-button @click="export_to_csv">Export table data to CSV</b-button>
                </b-col>
            </b-row>
            <br />
            <div class="form-check form-check-inline" v-for="field in this.checkbox_fields" :key="field">
                <input class="form-check-input" type="checkbox" v-model="fields_selected" :value="field" />
                <label class="form-check-label" for="inlineCheckbox1">{{field}}</label>
            </div>
            <br />
            <br />

            <div id="table"></div>
        </b-container>

        <b-modal v-model = "loadingModalVisible" hide-footer lazy hide-header-close no-close-on-esc no-close-on-backdrop>
            <template slot="modal-title">
                Please wait
            </template>
            <div class="d-block text-center">
                <div slot="table-busy" class="text-center text-danger my-2">
                    <b-spinner class="align-middle"></b-spinner>
                    <strong> Loading...</strong>
                </div>
            </div>
        </b-modal>
    </div>
</template>

<script>
import moment from "moment";
import { db } from "@/firebase.js";
import { Datetime } from 'vue-datetime'
import 'vue-datetime/dist/vue-datetime.css'
import { Timestamp } from "@/firebase.js";
import QueryTable from "../../components/QueryTable";
import Tabulator from "tabulator-tables";
import {filter} from '@/scripts/Search.js'
let setOrder = function(field) {
    var fieldVal = 0;
    if (field == "Check In") {
        fieldVal = 1;
    } else if (field == "Check Out") {
        fieldVal = 2;
    } else if (field == "Youth ID") {
        fieldVal = 3;
    } else if (field == "First Name") {
        fieldVal = 4;
    } else if (field == "Last Name") {
        fieldVal = 5;
    } else if (field == "Notes") {
        fieldVal = 6;
    } else if (field == "Period") {
        fieldVal = 8;
    } else {
        fieldVal = 7;
    }
    return fieldVal;
};

export default {
    name: "Stats",
    components: {
        Datetime,
        QueryTable,
        Tabulator
    },
    data() {
        return {
            lang: {
                days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                months: [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec"
                ],
                pickers: [
                    "next 7 days",
                    "next 30 days",
                    "previous 7 days",
                    "previous 30 days"
                ],
                placeholder: {
                    date: "Select a date",
                    dateRange: "Select Date Range"
                }
            },
            datePicker_date: "",
            dailyAttendanceTableItems: [],

            Earned_Period_Data: {
                season_options: [],
                year_options: [],
                selected_season: "",
                selected_year: ""
            },
            total_Hours_Earned_Data: [],
            total_Hours_Earned_Loading: false,
            total_Hours_Earned_Breakdown: {},
            total_Hours_Earned: 0,
            earned_Table_Fields: [],

            Spent_Period_Data: {
                season_options: [],
                year_options: [],
                selected_season: "",
                selected_year: ""
            },
            total_Hours_Spent_Data: [],
            total_Hours_Spent_Loading: false,
            total_Hours_Spent: 0,
            checkbox_fields: [],
            fields_selected: ["ID", "Name"], //Default to have ID selected
            table: {},

            loadingModalVisible: false
        };
    },
    methods: {
        showLoadingModal() {
            this.loadingModalVisible = true;
        },

        closeLoadingModal() {
            this.loadingModalVisible = false;
        },

        // Daily Attendace
        async lookupDailyAttendance() {
            // reset view 
            this.dailyAttendanceTableItems = [];

            this.showLoadingModal();
            let unprocessed_profiles = await this.getDailyAttendace();
            if (unprocessed_profiles == null) {
                // Display no values found 
                window.alert("Attendance by day: No entries found")
            } else {
                this.dailyAttendanceTableItems = unprocessed_profiles;
                this.dailyAttendanceTableItems.forEach(entry => {
                    entry["Check In"] = entry["Check In"].toDate().toLocaleString();
                    entry["Check Out"] = entry["Check Out"].toDate().toLocaleString();
                });
            }
            this.closeLoadingModal();
        },
        async getDailyAttendace() {
            let query_start_datetime = moment(this.datePicker_date).utcOffset(-6).toDate()
            let query_end_datetime = moment(query_start_datetime)
                .add(1, "days")
                .toDate();

            let queryResult = {};
            try {
                queryResult = await db
                    .collectionGroup("Work Log")
                    .where("Check In", ">", query_start_datetime)
                    .where("Check In", "<", query_end_datetime)
                    .get();
            } catch (err) {
                console.log(err);
                window.alert(err);
            }
            if (queryResult.empty) {
                return null;
            }
            let res = [];
            queryResult.forEach(doc => {
                var data = doc.data();
                const ordered = {};
                Object.keys(data)
                    .sort(function(a, b) {
                        var aVal = setOrder(a);
                        var bVal = setOrder(b);
                        return aVal - bVal;
                    })
                    .forEach(function(key) {
                        ordered[key] = data[key];
                    });
                res.push(ordered);
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

            let searchPeriod =
                this.Earned_Period_Data.selected_season +
                " " +
                this.Earned_Period_Data.selected_year.slice(2); //e.g. 2019 -> 19
            let query = {};
            try {
                query = await db
                    .collectionGroup("Work Log")
                    .where("Period", "==", searchPeriod)
                    .get();
            } catch (err) {
                console.log(err);
                window.alert(err);
            }
            query.forEach(doc => {
                var data = doc.data();
                data["Check In"] = data["Check In"].toDate();
                data["Check Out"] = data["Check Out"].toDate();
                const ordered = {};
                Object.keys(data)
                    .sort(function(a, b) {
                        var aVal = setOrder(a);
                        var bVal = setOrder(b);
                        return aVal - bVal;
                    })
                    .forEach(function(key) {
                        ordered[key] = data[key];
                    });
                data = ordered;
                this.total_Hours_Earned_Data.push(data);
                // Append hours to breakdown
                for (let key in data) {
                    // if a key is not a reserved keyword, then it is an hour logging category
                    // this is just in case that an hour logging category name has changed
                    if (
                        ![
                            "Check In",
                            "Check Out",
                            "First Name",
                            "Last Name",
                            "Notes",
                            "Period",
                            "Youth ID"
                        ].includes(key)
                    ) {
                        // undefined + 1 = 1, null + 2 = 2 etc. This takes care of initiation
                        if (this.total_Hours_Earned_Breakdown[key] == null) {
                            this.total_Hours_Earned_Breakdown[key] = parseFloat(data[key]);
                            this.total_Hours_Earned += parseFloat(data[key]);
                        } else {
                            this.total_Hours_Earned_Breakdown[key] += parseFloat(data[key]);
                            this.total_Hours_Earned += parseFloat(data[key]);
                        }
                    }
                }
            });
            //These fields must be protected in work log
            this.earned_Table_Fields = [
                { key: "Check In", sortable: true },
                { key: "Check Out", sortable: true },
                { key: "First Name", sortable: true },
                { key: "Last Name", sortable: true },
                { key: "Youth ID", sortable: true },
                { key: "total_hours" },
                // {key: 'Notes', sortable: true}, //this goes under details
                // {key: 'Period', sortable: true},
                { key: "show_details" }
            ];
            this.total_Hours_Earned_Loading = false;
        },

        // Total Hours Spent per quarter
        async handle_Total_Spent_By_Period_Search() {
            //reset
            this.total_Hours_Spent_Data = [];
            this.total_Hours_Spent_Loading = true;
            this.total_Hours_Spent = 0;

            let searchPeriod =
                this.Spent_Period_Data.selected_season +
                " " +
                this.Spent_Period_Data.selected_year.slice(2); //e.g. 2019 -> 19
            let query = {};
            // Grab Youth ID from this as well
            try {
                query = await db
                    .collectionGroup("Order Log")
                    .where("Period", "==", searchPeriod)
                    .get();
            } catch (err) {
                console.log(err);
                window.alert(err);
            }
            query.forEach(doc => {
                let data = doc.data();
                console.log(data);
                data["Order Date"] = data["Order Date"].toDate();

                //Grabbing Youth ID from query metaadata
                let regexp = /GlobalYouthProfile\/(\d*)\/Order Log/g;
                data["Youth ID"] = regexp.exec(doc.ref.path)[1];

                this.total_Hours_Spent_Data.push(data);

                // Append hours to total
                this.total_Hours_Spent += parseFloat(data["Item Total Cost"]);
            });
            this.total_Hours_Spent_Loading = false;
        },

        excludeEarnedTableHeaders(data) {
            let ret = [];
            let blacklistFields = this.earned_Table_Fields.map(field => {
                return field.key;
            });
            blacklistFields.push("_showDetails");
            Object.keys(data).forEach(key => {
                if (!blacklistFields.includes(key)) {
                    let res = {};
                    res[key] = data[key];
                    ret.push(res);
                }
            });
            return ret;
        },

        getSubtotalHours(dataRow) {
            let total = 0;
            Object.keys(dataRow).forEach(key => {
                if (
                    ![
                        "Check In",
                        "Check Out",
                        "First Name",
                        "Last Name",
                        "Notes",
                        "Period",
                        "Youth ID"
                    ].includes(key)
                ) {
                    let value = parseFloat(dataRow[key]);
                    if (!isNaN(value)) {
                        total += value;
                    }
                }
            });
            return total;
        },
        async getProfileData() {
            let profiles = await db.collection("GlobalYouthProfile").get();
            let squashed = profiles.docs.map(x => Object.assign(x.data(), { ID: x.id }));
            squashed = squashed.map(x=>{
                var combinedName = x["Last Name"] + ", " + x["First Name"];
                delete x["Last Name"];
                delete x["First Name"];
                x["Name"] = combinedName;
                if(x.ActivePeriods){
                    var newPeriods = [];
                    for (var el of Object.keys(x.ActivePeriods)){
                        newPeriods.push(` ${el}: ${x.ActivePeriods[el]}`)
                    }
                    x.ActivePeriods = newPeriods;
                }
                return x;
            })
            return squashed
        },
        async displayTable() {
            var tableData = await this.getProfileData();
            console.log(tableData);
            //This looks really complicated, but it's just because Javascript is kind of annoying
            //It takes each profile, gets its headers (field names), merges that list (.flat()), and then deduplicates them (... Set)
            this.checkbox_fields = [...new Set(tableData.map(x => Object.keys(x)).flat())].sort();
            this.checkbox_fields.splice(this.checkbox_fields.indexOf("ID"),1)
            this.checkbox_fields.splice(this.checkbox_fields.indexOf("Name"),1)
            this.checkbox_fields.unshift("ID","Name")
            this.table = new Tabulator("#table", {
                data: tableData,
                layout: "fitColumns",
                columns: this.fields_selected.map(x => {
                    return {
                        title: x,
                        field: x,
                        headerFilter: (x==="ID"||x==="Name"),
                        headerFilterFunc: filter
                    };
                }),
                pagination: "local",
                paginationSize: "20",
                selectable: 1,
                selectableRangeMode: "click"
            });

            table.set;
        },
        async export_to_csv() {
            this.table.download("csv", "data.csv");
        }
    },

    async mounted() {
        //Generate year selector
        this.Earned_Period_Data.year_options.push("2019"); //start point
        this.Spent_Period_Data.year_options.push("2019");
        let endPoint = moment()
            .add(10, "years")
            .format("YYYY"); //end point of selector
        for (let years = 0; years < parseFloat(endPoint) - 2019; years++) {
            let nextYear = 2019 + years + 1;
            this.Earned_Period_Data.year_options.push(nextYear.toString());
            this.Spent_Period_Data.year_options.push(nextYear.toString());
        }

        //Grab the Season choices e.g. summer spring fall etc.
        let seasonQuery = await db
            .collection("GlobalPeriods")
            .doc("metadata")
            .get();
        this.Earned_Period_Data.season_options = seasonQuery.data().Seasons;
        this.Spent_Period_Data.season_options = seasonQuery.data().Seasons;
        this.displayTable();
    },
    watch: {
        fields_selected: function(val, oldVal) {
            let nV = Object.values(Object.assign({}, val));
            nV.splice(nV.indexOf("ID"),1)
            nV.splice(nV.indexOf("Name"),1)
            nV.sort().unshift("ID","Name") //Force ID to always be leftmost column
            this.table.setColumns(nV.map(x => {
                    return {
                        title: x,
                        field: x,
                        headerFilter: true,
                        headerFilterFunc:  (x==="ID"||x==="Name") ? filter : "like"
                    };
                })
            );
        }
    }
};
</script>

<style>
.Special-input-demo {
    width: 50rem;
    margin: 0 auto;
}
</style>