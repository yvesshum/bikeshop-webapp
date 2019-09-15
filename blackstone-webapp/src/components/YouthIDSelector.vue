<!-- 
Component to select one youth profile from a list.

Usage:
    <YouthIDSelector
        placeholder="Some placeholder text"
        :periods="['summer19']"
    ></YouthIDSelector>

Props:

    placeholder - The placeholder text to display when no youth is selected. Default value is "Select an ID".

    periods - A list of periods to draw youth from. Special values:
        "current" - Youths active in the current period
        "next"    - Youths active in the next period
        "all"     - Youths active in any period
        "none"    - Youths not active in any period

        If no value is specified, defaults to using the current period.
    
        Examples:

        <YouthIDSelector :periods="['current', 'next']">
        Will draw from the current and next periods

        <YouthIDSelector periods="all"> or <YouthIDSelector :periods="'all'">
        Will draw from all periods
        (Note the lack of : in the first, and extra '' in the second - both are viable options)
        (See https://github.com/shentao/vue-multiselect/issues/24 for more info)

Emits:

    selected - The selected youth ID, as an object with the fields "First Name", "Last Name", and "ID". Emits "null" when no ID selected

    ready - The list of loaded youth profiles, emitted once the mounting/reloading process completes

 -->

<template>
    <div class = "YouthIDSelector">
        <multiselect v-model="value" id="multiselect" :options="options" :placeholder="placeholder" open-direction="bottom" label="name" :custom-label="nameWithID">
            <template slot="singleLabel" slot-scope="props">
                <span class="option__desc">
                    <span class="option__name">
                        {{ props.option['First Name'] }} {{ props.option['Last Name'] }}
                    </span>
                    <br />
                    <small class="option__id">
                        ID: {{ props.option['ID'] }}
                    </small>
                </span>
            </template>
            <template slot="option" slot-scope="props">
                <div class="option__desc">
                    <span class="option__name">
                        {{ props.option['First Name'] }} {{ props.option['Last Name'] }}
                    </span>
                    <br>
                    <small class="option__id">
                        ID: {{ props.option['ID'] }}
                    </small>
                </div>
            </template>
        </multiselect>
    </div>
</template>


<script>
    import {firebase} from '../firebase'
    import {db} from '../firebase'
    import Multiselect from 'vue-multiselect'
    export default {
        name: 'YouthIDSelector',
        components: { Multiselect },
        props: {
            placeholder: {
                type: String,
                default: "Select an ID",
            },
            periods: {
                type: [String, Array],
                default: "current"
            },
        },
        data () {
            return {
                value: '',
                options: [],

                vars_coll: db.collection("GlobalVariables"),
                active_periods_doc: null,
                past_periods_doc: null,

                using_past: false,

                id_list: null,
            }
        },
        methods: {
            // Retrieve all youth from the specified periods from the database
            async getData() {

                // Load active periods from the database
                // TODO: Attach as a listener? If not, only load the one time?
                this.active_periods_doc = await this.vars_coll.doc("ActivePeriods").get();

                // Data from the retrieved doc(s) - past_data will only be retrieved if needed
                let data = this.active_periods_doc.data();
                let past_data = null;

                // Names of current and next period
                let ap = data["CurrentPeriod"];
                let fp = data["FuturePeriod"];

                // The variable to store the results in
                let youth_arr = [];

                // Create a modified array `periods` decoding special inputs (see usage comment)
                let periods = [];

                // Parent set prop to "all" - wants all youth
                if (this.periods == "all") {
                    periods = [ap, fp, "none", ...data["PastPeriods"]];
                    this.using_past = true;
                }

                // Replace instances of "current" and "next" with the appropriate names
                else {
                    let temp = (Array.isArray(this.periods)) ? this.periods : [this.periods];
                    periods = temp.map((item) => {
                        if (item == "current") {
                            return ap;
                        }
                        if (item == "next") {
                            return fp;
                        }
                        return item;
                    });

                    this.using_past = periods.length > 0;
                };

                // Load data from the past periods doc, only if necessary (as determined above)
                if (this.using_past) {
                    this.past_periods_doc = await this.vars_coll.doc("PastPeriods").get();
                    past_data = this.past_periods_doc.data();
                }

                // Loop through each period and add the relevant youth to the bar
                periods.forEach(function(period) {
                    try {
                        switch (period) {
                            case "none":
                                youth_arr = youth_arr.concat(data["NeverActiveYouths"]);
                                break;
                            case ap:
                                youth_arr = youth_arr.concat(data["CurrentActiveYouths"]);
                                break;
                            case fp:
                                youth_arr = youth_arr.concat(data["FutureActiveYouths"]);
                                break;
                            default:
                                youth_arr = youth_arr.concat(past_data[period]);
                                break;
                        }
                    } catch (error) {
                        console.log("YouthIDSelector: Cannot load youths from period \"" + period + "\".", error);
                    };
                });

                // Remove duplicates and sort
                youth_arr = unique(youth_arr).sort();

                // Return the final result
                return youth_arr;


                // Helper function - remove duplicate values from an array
                function unique(arr) {
                    return arr.filter(function(youth, n, arr) {
                        return arr.indexOf(youth) == n;
                    });
                };
            },

            // Package name and ID into a searchable string
            // Includes name as-is and name with accents removed, for searching purposes
            nameWithID (youth) {
                let full_str = `${youth["First Name"]} ${youth["Last Name"]} ${youth["ID"]}`;
                return full_str + " " + full_str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                // https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
            },

            //Needed for Check In
            reset() {
                this.value = null;
            }

        },

        watch: {
            value: function() {
                this.$emit('selected', this.value);
            },

            periods: async function() {
                this.options = await this.getData();
                this.$emit("ready", this.options);
            },
        },

        async mounted() {
            // Load the list of youths
            this.options = await this.getData();

            // Emit the ready message
            this.$emit("ready", this.options);
        }
    }
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>

<style scoped>
    .YouthIDSelector {
        width: 70%;
        position: relative;
        left: 15%;
        right: 15%;
    }


</style>


