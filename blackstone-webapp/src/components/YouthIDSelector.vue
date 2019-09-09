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
        <multiselect
            v-model="value"
            id="multiselect"
            :options="filtered_options"
            :placeholder="placeholder"
            open-direction="bottom"
            label="name"
            :custom-label="nameWithID"
            :internal-search="false"
            @search-change="val => search_term = val"
        >
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
                search_term: "",

                vars_coll: db.collection("GlobalVariables"),
                active_periods_doc: null,
                past_periods_doc: null,

                using_past: false,
            }
        },

        computed: {
            /* Search algorithm:

             A profile is considered to match the current search if there is a unique mapping from terms in the search (strings separated by spaces) to fields in the profile (First Name, Last Name, and ID).  That is, we want:

             - Every term matches at least one field (e.g. no extra terms that match nothing)

             - A unique mapping from terms to fields (e.g. if the user types in the first name five times, we don't want to match).

             Special case: A blank search term is the same as no search term, not a search for an empty string (which, in fairness, would technically match everything).

             */
            filtered_options: function() {

                // Special case: If the search term is blank, match everything
                if (this.search_term == "") return this.options;

                // Split search string into individual lowercase terms
                var terms = this.search_term.split(' ').filter(s => s.length > 0);
                var num_terms = terms.length;

                // Filter the options
                return this.options.filter(opt => {

                    // Split fields into individual terms
                    // This will catch name fields with multiple names, such as middle names (e.g. "John Smith Jones"
                    var fields = [];
                    Object.keys(opt).forEach(key => {
                        opt[key].split(' ').filter(s => s.length > 0).forEach(s => fields.push(s));
                    });

                    // If the number of terms exceeds the number of fields, no match
                    if (num_terms > fields.length) {
                        return false;
                    };

                    // Create a matrix of Booleans representing which terms match which fields
                    // Rows are fields, columns are terms
                    let matched_fields = match_matrix(fields, terms, (field, term) => {

                        // Get the name in lowercase as-is
                        let normal = field.toLowerCase();

                        // Get the name with all accents removed
                        let plain = this.plaintext(normal);

                        // Return true if the current term is a substring of either
                        return normal.indexOf(term) !== -1 || plain.indexOf(term) !== -1;
                    });

                    // Calculate how many of the fields are matched by at least one term
                    let num_fields_matched = matched_fields.reduce(
                        // Increment the accumulator for each matrix row that has at least one "true" value
                        (acc, curr) => acc += curr.includes(true) ? 1 : 0, 0
                    );

                    // Create an array of terms which don't match any field
                    let unmatched_terms = terms.filter((term, n) => {

                        // Grab each matrix row's value at the current term's index (e.g. whether the field for that row matches the current term) and combine all these values with OR (such that if any value in this term's column is true, the result will be true). Then, return it inverted for filter.
                        // Equivalent to "false || matched_fields[0][n] || matched_fields[1][n] || ..."
                        return !matched_fields.reduce((acc, curr) => acc || curr[n], false);
                    });

                    // The current option should match the search if:
                    //  - There are no terms which don't match any field
                    //  - The total number of terms is not greater than than the number of fields with a matching term. If it were greater, then two terms would have to match the same field.
                    return (unmatched_terms.length === 0) && (num_fields_matched >= num_terms);
                });

                // Convert two arrays (rows, cols) into a matrix of booleans, where each cell represents whether the given row value and column value match according to some specified matching function (match).
                function match_matrix(rows, cols, match) {
                    return rows.map(row => cols.map(col => match(row, col)));
                };
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

            // Package name and ID into a string
            nameWithID (youth) {
                return `${youth["First Name"]} ${youth["Last Name"]} ${youth["ID"]}`;
            },

            //Needed for Check In
            reset() {
                this.value = null;
            },

            // Get a name string in plaintext (accents removed, etc)
            // Source: https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
            plaintext(str) {
                return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            },
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


