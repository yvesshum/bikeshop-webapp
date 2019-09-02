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

    selected - The selected youth ID, in the format "FirstName LastName YouthID". Emits "null" when no ID selected

    ready - The list of loaded youth profiles, emitted once the mounting/reloading process completes

 -->

<template>
    <div class = "YouthIDSelector">
        <multiselect v-model="value" id="multiselect" :options="options" :placeholder="this.r_placeholder" open-direction="bottom" label="name" :custom-label="nameWithID">
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
        props: [
            "placeholder",
            "periods",
        ],
        data () {
            return {
                value: '',
                options: [],

                vars_coll: db.collection("GlobalVariables"),
                active_periods_doc: null,
                past_periods_doc: null,

                using_past: false,

                r_placeholder: null,
                def_placeholder: "Select an ID", //Select your ID if you are currently active

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
                    periods = [ap].concat(fp).concat(data["PastPeriods"]).concat("none");
                    this.using_past = true;
                }

                // Parent didn't set prop - use current by default
                else if (this.periods == null) {
                    periods = [ap];
                    this.using_past = false;
                }

                // Replace instances of "current" and "next" with the appropriate names
                else {
                    var use_curr = this.periods.includes(ap) || this.periods.includes("current");
                    var use_next = this.periods.includes(fp) || this.periods.includes("next");
                    periods = this.periods.filter((n) => {
                        n != ap && n != "current" && n != fp && n != "next"
                    });

                    this.using_past = periods.length > 0;
                    if (use_curr) periods.push(ap);
                    if (use_next) periods.push(fp);
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

            // Format list of ID strings "FirstName LastName ID" into list of objects
            getOptions(data) {
                var id_list = [];
                data.forEach(function(item, index) {
                    id_list.push(item);
                });
                return id_list;
            },

            // Reformat separated name/id into single string
            nameWithID ({ name, id }) {
                return `${name} ${id}`;
            },

            //Needed for Check In
            reset() {
                this.value = null;
            }

        },

        watch: {
            value: function() {
                if (this.value == null) {
                    this.$emit('selected', null);
                } else {
                    this.$emit('selected', this.value);
                };
            },

            periods: async function() {
                let data = await this.getData();
                this.options = this.getOptions(data);
                this.$emit("ready", this.options);
            },

            placeholder: function() {
                this.r_placeholder = (this.placeholder == null) ? this.def_placeholder : this.placeholder;
            },
        },

        async mounted() {
            // Set placeholder to passed or default value
            this.r_placeholder = (this.placeholder == null) ? this.def_placeholder : this.placeholder;

            // Load the list of youths
            let data = await this.getData();

            // Create list of IDs from returned youths
            this.options = this.getOptions(data);

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


