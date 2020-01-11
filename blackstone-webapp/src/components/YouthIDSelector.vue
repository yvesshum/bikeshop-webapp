<!-- 
Component to select one youth profile from a list.

Usage:
    <YouthIDSelector
        placeholder="Some placeholder text"
        :periods="['summer19']"
        sortBy="ID"
    ></YouthIDSelector>

    <YouthIDSelector periods="all" />

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

    sortBy - The field(s) to sort the options by. May be a string or an array, where each string must be one of "First Name", "Last Name", or "ID".

        By default, uses the order: First Name, Last Name, ID

        Any terms passed in to this prop will be moved to the front of this order; e.g., for the following prop values, the options will be sorted by fields in the following order:

            ["Last Name"]       => Last Name, First Name, ID

            ["ID"]              => ID, First Name, Last Name

            ["ID", "Last Name"] => ID, Last Name, First Name

Emits:

    selected - The selected youth ID, as an object with the fields "First Name", "Last Name", and "ID". Emits "null" when no ID selected

    ready - The list of loaded youth profiles, emitted once the mounting/reloading process completes

 -->

<template>
    <div class = "YouthIDSelector">
        <div class="multiselect_container">
        <multiselect
            v-model="value"
            :options="filtered.options"
            :placeholder="placeholder"
            :internal-search="false"
            @search-change="val => search_term = val"
            :show-labels="false"
            :block-keys="['Tab', 'Enter']"
            :preserveSearch="true"
            :loading="is_busy"
            v-bind="args"
            :trackBy="'ID'"
            :label="'Display'"
        >
            <template slot="singleLabel" slot-scope="props">
                <span class="option__desc">
                    <span class="option__name">
                        {{props.option["First Name"]}} {{props.option["Last Name"]}}
                    </span>
                    <br />
                    <small class="option__id">
                        ID: {{props.option["ID"]}}
                    </small>
                </span>
            </template>

            <template slot="option" slot-scope="props">
                <div class="option__desc">
                    <span class="option__name">
                        <span v-for="s in filtered.displays[props.option['ID']]['First Name']">
                            <span :class="{search_highlight: s.mark}">{{s.seg}}</span>
                        </span>&nbsp;<span v-for="s in filtered.displays[props.option['ID']]['Last Name']">
                            <span :class="{search_highlight: s.mark}">{{s.seg}}</span>
                        </span>
                    </span>
                    <br />
                    <small class="option__id">
                        ID: <span v-for="s in filtered.displays[props.option['ID']]['ID']">
                            <span :class="{search_highlight: s.mark}">{{s.seg}}</span>
                        </span>
                    </small>
                </div>
            </template>
        </multiselect>
        </div>

        <b-button v-b-tooltip.hover.html="tooltip_data" variant="info" squared>?</b-button>
    </div>
</template>


<script>
    import {firebase} from '../firebase'
    import {db} from '../firebase'
    import Multiselect from 'vue-multiselect'
    import {Period} from '@/scripts/Period.js';
    import {Youth}  from '@/scripts/Youth.js';
    import {search} from '@/scripts/Search.js';
    import {SPECIAL_CHARS} from '@/scripts/Search.js';

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
                type: [String, Array],
                default: () => Youth.requiredVals(),
                validator: function(value) {
                    // Get value as singleton array if passed as string
                    let s = (Array.isArray(value)) ? value : [value];
                    // Reduce array with && to ensure all values are required vals
                    return s.reduce((a,c) => a && Youth.isRequiredVal(c), true)
                },
            },
            args: {
                type: Object,
                default: () => {},
            },
        },
        data () {
            return {
                value: '',
                options: [],
                search_term: "",

                vars_coll: db.collection("GlobalPeriods"),
                period_doc: null,
                past_periods_doc: null,

                using_past: false,

                is_busy: false,
            }
        },

        computed: {

            // Creates the message displayed in the help tooltip
            tooltip_data: function() {
                let ret = `Characters with diacritics, such as ${str_list(["é","ñ","ç","ł"])}, may be entered plain (i.e. as ${str_list(["e","n","c","l"])}). `;

                ret += "In addition, the following substitutions may be made:<br />";

                SPECIAL_CHARS.forEach((char_obj) => {
                    let c = char_obj.special;
                    let r = char_obj.regular;
                    let caps = char_obj.show_caps;

                    if (char_obj.display) {
                        ret += `${ (caps) ? c.toUpperCase() : "" }${c} ⇒ ${ r.bold() }<br />`;
                    }
                });

                ret += "(The above list is not exhaustive)";

                return ret;

                function str_list(chars) {
                    let str = "";
                    for (var i = 0; i < chars.length-1; i++) {
                        str += chars[i].bold().italics() + ", ";
                    }
                    str += "and " + chars[chars.length-1].bold().italics();
                    return str;
                };
            },

            /* Search algorithm:

             A profile is considered to match the current search if there is a unique mapping from terms in the search (strings separated by spaces) to fields in the profile (First Name, Last Name, and ID).  That is, we want:

             - Every term matches at least one field (e.g. no extra terms that match nothing)

             - A unique mapping from terms to fields (e.g. if the user types in the first name five times, we don't want to match).

             Special case: A blank search term is the same as no search term, not a search for an empty string (which, in fairness, would technically match everything).

             The resulting array will simply be a filtered version of the options variable. This is important - it keeps the option objects consistent across different search terms, so the current selection isn't cleared every time the search changes, as it would be if the object were to change.

             NOTE that this function has the side effect of altering the name_displays variable, which holds information on how to display each option given the current search.

             */
            filtered: function() {

                // Start the loading icon
                this.is_busy = true;

                // Split search string into individual lowercase terms
                var terms = this.search_term.split(' ')
                    .filter(s => s.length > 0)
                    .map(s => s.toLowerCase());
                var num_terms = terms.length;

                // Variables to hold the options list and the corresponding display strings
                var options;
                var displays = new Object();

                // Special case: If the search term is blank, match everything
                // Note that the search function can handle this too, but in this case
                // it's easier to just do this all at once
                var num_terms = this.search_term.split(' ').filter(s => s.length > 0).length;
                if (num_terms === 0) {

                    // Create the unmarked displays for each option, and return all options
                    // Since there is no search, the Display fields will all be singleton arrays where the one element is an unmarked segment representing the whole string.
                    this.options.forEach(opt => {
                        let temp = {};
                        Object.keys(opt).forEach(key => {
                            temp[key] = [{seg: opt[key], mark: false}];
                        });
                        displays[opt["ID"]] = temp;
                    });

                    options = this.options.sort(this.sort_options());
                }

                options = this.options.filter(option => {
                    var valid = search(this.search_term, option, {
                        fields: Youth.requiredVals(),
                        remove_overlap: true,
                    });

                    // Special case - empty search term
                    if (valid == true) {
                        // Create the unmarked displays for each option, and return all options
                        // Since there is no search, the Display fields will all be singleton arrays where the one element is an unmarked segment representing the whole string.
                        let temp = {};
                        Object.keys(option).forEach(key => {
                            temp[key] = [{seg: option[key], mark: false}];
                        });
                        displays[option["ID"]] = temp;

                        return true;
                    }

                    // Option failed the search - remove it
                    else if (valid == null || valid == false) {
                        return false;
                    }

                    // Initialize a new object to store the display version of the option
                    // The display version will be broken up to indicate where the matches are, so they can be highlighted
                    var opt_display = {};

                    Youth.requiredVals().forEach(key => {

                        var indices = valid[key].concat([[option[key].length,0]]);;
                        var new_str = [];

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
                        let id = option["ID"];

                        if (displays[id] == null) {
                            displays[id] = {};
                        }

                        if (displays[id][key] == null) {
                            displays[id][key] = new_str;
                        }
                        else {
                            displays[id][key] = displays[id][key].concat(new_str);
                        }

                        // Helper function to take a slice of the field (which is the string version broken into individual accented characters) and mark it accordingly. Note that if the slice is blank, nothing needs to be added.
                        // TODO: Write this more cleanly
                        function add_segment(start, end, mark) {
                            if (end - start > 0) {
                                new_str.push({
                                    // seg: split[n].slice(start,end).map(c => c.char).join(""),
                                    seg: option[key].substring(start,end),
                                    mark
                                });
                            }
                        };
                    });

                    return true;
                });

                options = options.sort(this.sort_options(displays));

                // Stop the loading icon
                this.is_busy = false;

                // Return the options and displays as one object
                return {options, displays};
            },

            // Get a filled out array of fields from the sortBy prop
            // Pads the end of the sortBy array with any missing values from youth fields in their default order. This ensures that all fields are considered in a sort, and allows the parent to only pass the fields it cares about sorting by, falling back on the other fields in a predefined way.
            sort_by: function() {
                // If sortBy is a string, convert it to a singleton array
                let arr = get_as_arr(this.sortBy);

                // Combine values in arr and remaining values in youth fields which are not in arr
                return [...arr, ...Youth.requiredVals().filter(k => !arr.includes(k))];

                // Convert a non-array value to a singleton array
                function get_as_arr(val) {
                    return (Array.isArray(val)) ? val : [val];
                }
            }
        },

        methods: {
            // Retrieve all youth from the specified periods from the database
            async getData() {

                // Start the loading icon
                this.is_busy = true;

                // Load active periods from the database
                // TODO: Attach as a listener? If not, only load the one time?
                this.period_doc = await this.vars_coll.doc("metadata").get();

                // Data from the retrieved doc(s) - past_data will only be retrieved if needed
                var data = this.period_doc.data();

                // Set the season list for the Period object
                await Period.setSeasons(data["Seasons"]);


                // Names of current and next period
                var fp = data["FirstPeriod"];
                var ap = data["CurrentPeriod"];
                var rp = data["CurrentRegistrationPeriod"];

                // The variable to store the results in
                var youth_arr = [];

                // Create a modified array `periods` decoding special inputs (see usage comment)
                var periods = [];

                // Parent set prop to "all" - wants all youth
                if (this.periods == "all") {
                    periods = Period.enumerate(fp, rp);
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
                };

                // Get the years
                var year_matrix = Period.makeMatrix(periods);
                var years = Object.keys(year_matrix);

                for (var i = 0; i < years.length; i++) {
                    let year = years[i];

                    // Load the given year's document from the database
                    let year_doc = await this.vars_coll.doc(year).get();
                    let year_data = year_doc.data();

                    // Loop through each season in this year to load youth from
                    year_matrix[year].forEach(season => {
                        let new_profiles = year_data[Period.concat(season, year)];

                        // If the given period does not exist, send a warning in the console and skip to the next period
                        if (new_profiles == undefined) {
                            console.warn("Cannot load youths from period \"" + Period.concat(season, year) + "\".");
                            return;
                        }

                        // Add non-duplicate youth to the full array
                        youth_arr = youth_arr.concat(new_profiles.filter(profile => {
                            return !Youth.contains(youth_arr, profile);
                        }));
                    });
                };

                // Sort the result
                youth_arr = youth_arr.sort();

                // Add display version of each youth's information to the object
                youth_arr.forEach(y => y["Display"] = Youth.getNameWithID(y));

                // Stop the loading icon
                this.is_busy = false;

                // Return the final result
                return youth_arr;
            },

            //Needed for Check In
            reset() {
                this.value = null;
            },

            // Format special characters in a string based on options:
            //   - accents:
            //      "none"      - No accents
            //      "separated" - Accents are separate characters
            //      "all"       - Accents included
            //   - special:
            //      true  - Keep special characters
            //      false - Replace special characters with keyboard equivalents
            //   - case:
            //      "lower" - Make the result lowercase
            //      "upper" - Make the result uppercase
            //      "keep"  - Don't change case
            parse_text(str, options) {
                var ret = str.slice();

                let defaults = {
                    accents: "none",
                    special: false,
                    case: "keep",
                };

                let opts = {...defaults, ...options};

                switch (opts.accents) {
                    case "none":
                        // Source: https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
                        ret = normalize(ret).replace(/[\u0300-\u036f]/g, "");
                        break;
                    case "separate":
                        ret = normalize(ret);
                        break;
                    default:
                        break;
                };

                if (!opts.special) {
                    SPECIAL_CHARS.forEach(obj => {
                        ret = ret.replace(new RegExp(obj.special, "g"), obj.regular);
                    })
                }

                switch (opts.case) {
                    case "lower":
                        ret = ret.toLowerCase();
                        break;
                    case "upper":
                        ret = ret.toUpperCase();
                        break;
                    default:
                        break;
                }

                return ret;

                function normalize(str) {
                    return str.normalize("NFD");
                };
            },

            // Create a function to sort options by relevance
            // Sort Order:
            //   - By relevance to search(number of marked segments in display)
            //   - By field (alphabetically by name, numerically by ID)
            // NOTE: Use displays = null to mean no search - if so, just order by field
            //       This can also be accomplished by calling the function with no args.
            // NOTE: The order to check fields in is contained in "sort_by" array
            // USE: This is run once to construct a sorting function based on the current display values of each profile, and the resulting function is then run by .sort()
            sort_options(displays) {

                // Create a sort function based on the values in the displays variable
                return (a, b) => {

                    // If there is a search term, sort by relevance first
                    if (displays != null) {

                        // Calculate whether either value has more marked segments
                        let weights = weight(b) - weight(a);

                        // If there is a difference between the weights, sort by it
                        if (weights) return weights;
                    }

                    // If the weights are the same or there is no search term in the first place, sort by fields in the order given by the sort_by prop
                    for (var i in this.sort_by) {
                        let diff;
                        let field = this.sort_by[i];

                        // Check whether one or both of the fields does not exist. Note that this should not occur with complete data, since the fields this sorts by are required fields; this is to prevent crashing.
                        // Sort null values after existing ones
                        if (a[field] == null) {
                            // If both fields do not exist, continue on to the next field
                            if (b[field] == null) {
                                continue;
                            }
                            // If b exists but a doesn't, sort b first
                            else {
                                return 1;
                            }
                        }
                        // If a exists but b doesn't, sort a first
                        else if (b[field] == null) {
                            return -1;
                        }

                        // Sort numeric IDs numerically
                        if (field == "ID" && !isNaN(a[field]) && !isNaN(b[field])) {
                            diff = Number(a[field]) - Number(b[field]);
                        }

                        // Sort string values stringily
                        else {
                            diff = a[field].localeCompare(b[field]);
                        }

                        // If there is a difference between the fields, sort by it
                        if (diff) return diff;
                    }

                    // If we've made it to this point, all of the fields in the profile are identical
                    // TODO: Error handling for this case
                    console.warn("Identical profiles found: ", a, b);
                    return 0;
                };

                // Helper function to get the number of marked segments in an option
                function weight(v) {
                    return Object.keys(displays[v.ID]).reduce(
                        (acc, curr) => acc + displays[v.ID][curr].filter(s => s.mark).length, 0
                    );
                }
            },

            // Split a string into characters stored as objects, where each object contains:
            //   char: The character as-is, along with all accents
            //   norm: The lowercase plaintext version of the character
            split_special_chars(str) {

                // Initialize the return array
                let ret = [];

                // Split the input string into an array of characters, and loop through each
                Array.from(str).forEach(char => {

                    // If the current character is an accent, include it in the previous char
                    // This catches accents which are separated from the base character for some reason, as well as characters with multiple accents, such as those in the Vietnamese alphabet
                    if (char.match(/[\u0300-\u036f]/)) {
                        ret[ret.length-1].char += char;
                    }

                    // Otherwise, add the character in plaintext and as-is
                    else {
                        let norm = this.parse_text(char.toLowerCase(), {
                            accents: "none",
                            special: false
                        });
                        ret.push({char, norm});
                    }
                });

                // Return the return array
                return ret;
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
        width: 100%;
        position: relative;
        /*left: 15%;*/
        /*right: 15%;*/
        /*display: block;*/
    }

    .multiselect_container {
        width: 80%;
        display: inline-block;
    }

    .search_highlight {
        background-color: #FEFCBD;
        color: black;
        font-weight: bold;
    }


</style>


