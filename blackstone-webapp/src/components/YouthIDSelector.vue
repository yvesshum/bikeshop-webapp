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
            :options="filtered_options"
            :placeholder="placeholder"
            open-direction="bottom"
            :internal-search="false"
            @search-change="val => search_term = val"
        >
            <template slot="singleLabel" slot-scope="props">
                <span class="option__desc">
                    <span class="option__name">
                        <span v-for="s in props.option.Display['First Name']">
                            <span>{{s.seg}}</span>
                        </span>&nbsp;<span v-for="s in props.option.Display['Last Name']">
                            <span>{{s.seg}}</span>
                        </span>
                    </span>
                    <br />
                    <small class="option__id">
                        ID: <span v-for="s in props.option.Display['ID']">
                            <span>{{s.seg}}</span>
                        </span>
                    </small>
                </span>
            </template>
            <template slot="option" slot-scope="props">
                <div class="option__desc">
                    <span class="option__name">
                        <span v-for="s in props.option.Display['First Name']">
                            <span :class="{search_highlight: s.mark}">{{s.seg}}</span>
                        </span>&nbsp;<span v-for="s in props.option.Display['Last Name']">
                            <span :class="{search_highlight: s.mark}">{{s.seg}}</span>
                        </span>
                    </span>
                    <br>
                    <small class="option__id">
                        ID: <span v-for="s in props.option.Display['ID']">
                            <span :class="{search_highlight: s.mark}">{{s.seg}}</span>
                        </span>
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
            sortBy: {
                type: String,
                default: "ID",
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

             Objects in the resulting array will have the following fields:

                Real: The actual profile object represented.

                Display: A marked version of the profile object split into marked and unmarked substrings, used to highlight regions which match the current search.

             */
            filtered_options: function() {

                // Split search string into individual lowercase terms
                var terms = this.search_term.split(' ')
                    .filter(s => s.length > 0)
                    .map(s => s.toLowerCase());
                var num_terms = terms.length;

                // Variable to hold the options list
                var options;

                // Special case: If the search term is blank, match everything
                if (num_terms === 0) {

                    // Create the Real and Display fields for each option
                    // Since there is no search, the Display fields will all be singleton arrays where the one element is an unmarked segment representing the whole string.
                    options = this.options.map(opt => {
                        let temp = {};
                        Object.keys(opt).forEach(key => {
                            temp[key] = [{seg: opt[key], mark: false}];
                        });
                        return {Real: opt, Display: temp};
                    });
                }

                // Filter the options
                else {

                    options = this.options.map(opt => {

                        // Split object fields into individual terms, and keep track of which new string came from which fielt with the fields array.
                        // This will catch name fields with multiple names, such as middle names.
                        // For example, the following profile object:
                        //
                        //      {First Name: "John Smith", Last Name: "Jones"}
                        //
                        // ...produces:
                        //
                        //      fields:     ["John",       "Smith",      "Jones"]
                        //      obj_fields: ["First Name", "First Name", "Last Name"]
                        //
                        var fields = [];
                        var obj_fields = [];
                        Object.keys(opt).forEach(key => {
                            opt[key].split(' ').filter(s => s.length > 0).forEach(s => {
                                fields.push(s);
                                obj_fields.push(key);
                            });
                        });

                        // If the number of terms exceeds the number of fields, no match
                        if (num_terms > fields.length) {
                            return null;
                        };

                        // Create a matrix of arrays representing which the indices at which each term can be found in each field.
                        // If the term and field don't match, the default value is an empty array.
                        // Rows are fields, columns are terms
                        let matched_fields = match_matrix(fields, terms, (field, term) => {

                            // Get the name in lowercase as-is
                            let normal = field.toLowerCase();

                            // Get the name with all accents removed
                            let plain = this.plaintext(normal);

                            // Get the indices the term can be found at in each
                            let normal_i = indices(normal, term);
                            let plain_i  = indices(plain,  term);

                            // Merge these into one array, discarding duplicate values
                            return combine_unique(normal_i, plain_i);
                        });

                        // Calculate how many of the fields are matched by at least one term
                        let num_fields_matched = matched_fields.reduce(
                            // Increment the accumulator for each matrix row that has at least one non-empty array
                            // The 0 on the end starts the accumulator from 0 - this is important
                            (acc, curr) => acc + (concat_all(curr).length ? 1 : 0), 0
                        );

                        // Create an array of terms which don't match any field
                        let unmatched_terms = terms.filter((term, n) => {
                            // Grab each matrix row's value at the current term's index (i.e. the indices where the term can be found in the row's field) and combine all these values with OR (such that if any value in this term's column is non-empty, the result will be true). Then, return it inverted for filter.
                            // Equivalent to "false || matched_fields[0][n] || matched_fields[1][n] || ..."
                            return !matched_fields.reduce((acc, curr) => acc || curr[n].length, false);
                        });

                        // The current option should match the search if:
                        //
                        //  - There are no terms which don't match any field
                        //  - The total number of terms is not greater than than the number of fields with a matching term. If it were greater, then two terms would have to match the same field.
                        //
                        // If either of these conditions is not met, return null (to be removed at a later step).
                        if ((unmatched_terms.length !== 0) || (num_fields_matched < num_terms)) {
                            return null;
                        };

                        // All options past this point do match the search.

                        // Initialize a new object to store the display version of the option
                        // The display version will be broken up to indicate where the matches are, so they can be highlighted
                        var opt_display = {};

                        // Cycle through each key in the option - First Name, Last Name, ID
                        obj_fields.forEach((key, n) => {

                            // Set field to the value of this key
                            let field = fields[n];
                            let new_str = [];

                            // Filter out duplicate terms
                            // We already know from the if statement above that the mapping from terms to fields is one-to-one, so for the code below we only want to have each unique term once.
                            let unique_terms = terms.filter((t, m, arr) => arr.indexOf(t) == m);

                            // Create an array of all the indices which match some term, along with the length of the term they match. Will have the form:
                            //
                            //      [[start, term_length], [start, term_length] ...]
                            //
                            let all_indices = concat_all(
                                unique_terms.map((term, m) => {
                                    let len = term.length;
                                    return matched_fields[n][m].map(i => [i,len]);
                                })
                            );

                            // Strap in ladies and gents, this one is gonna be wild
                            // Process the indices so they are in ascending order with no overlap.
                            // By the end, we want to know where to start each highlight, and how long it should be.
                            // For processing purposes later, the length of the string (the "final index") is added with a highlight length of 0. This is so that when the field string is broken into substrings, we have one final substring which reaches to the end.
                            var indices = all_indices
                                // Sort indices by the numerical values of their start positions
                                .sort(([a_index, a_len], [b_index, b_len]) => a_index - b_index)
                                // Remove any indices which would start inside another highlighted region (i.e. get rid of overlaps)
                                .filter((curr, n, arr) => {
                                    // Keep the first index regardless
                                    if (n == 0) return true;
                                    // Return whether current index is within term length of previous index
                                    let prev = arr[n-1];
                                    return (curr[0] - prev[0] >= prev[1]);
                                })
                                // Add the final index with highlight length 0
                                .concat([[field.length,0]]);

                            // Use indices to cut the field into marked and unmarked substrings.
                            for (var i in indices) {

                                // At the beginning, add an unmarked region from the start of the string to the current index
                                if (i == 0) {
                                    add_segment(0, indices[i][0], false);
                                }

                                // Otherwise, add a marked region starting at the previous index and extending for the length of the previous index, then add the remainder up to the current index as an unmarked region.
                                // Note that because of the filtering above, we don't have to worry about the end of the marked region being larger than the current index.
                                else {
                                    let prev_index = indices[i-1][0];
                                    let curr_index = prev_index + indices[i-1][1];
                                    let next_index = indices[i][0];

                                    add_segment(prev_index, curr_index, true);
                                    add_segment(curr_index, next_index, false);
                                }
                            }

                            // Set display value for this field to the cumulative new_str array.
                            if (opt_display[key] == null) {
                                opt_display[key] = new_str;
                            }
                            else {

                                opt_display[key] = opt_display[key]
                                    .concat({seg: " ", mark: false})
                                    .concat(new_str);
                            }

                            // Helper function to take a substring of the field and mark it accordingly. Note that if the substring is blank, nothing needs to be added.
                            function add_segment(start, end, mark) {
                                if (end - start > 0) {
                                    new_str.push({seg: field.substring(start, end), mark});
                                }
                            };
                        });

                        // Return the new option, consisting of the Real and Display fields
                        return {Real: opt, Display: opt_display};

                    // Remove any null elements (options which didn't match the search)
                    }).filter(k => k != null);
                }

                // Sort and return the new options
                return options.sort(this.sort_options);


                // =-= Helper Functions =-=-=

                // Convert two arrays (rows, cols) into a matrix of booleans, where each cell represents whether the given row value and column value match according to some specified matching function (match).
                function match_matrix(rows, cols, match) {
                    return rows.map(row => cols.map(col => match(row, col)));
                };

                // Combine and sort two arrays
                function combine_unique(arr1, arr2) {
                    return [...arr1, ...arr2].sort().filter((e, n, arr) => arr.indexOf(e) === n);
                };

                // Flatten an array of arrays into a single array with all elements
                function concat_all(arr) {
                    return arr.reduce( (acc, curr) => acc.concat(curr) );
                };

                // Get all indices of a given substring "sub" in a source string "str"
                function indices(str, sub) {
                    let acc = 0;
                    return str.split(sub).slice(0,-1).map((s, n) => {
                        acc += s.length;
                        return acc + (n * sub.length);
                    });
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

            sort_options(a, b) {
                return a.Real[this.sortBy].localeCompare(b.Real[this.sortBy]);
            },
        },

        watch: {
            value: function() {
                this.$emit('selected', this.value.Real);
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

    .search_highlight {
        background-color: #FEFCBD;
        color: black;
        font-weight: bold;
    }


</style>


