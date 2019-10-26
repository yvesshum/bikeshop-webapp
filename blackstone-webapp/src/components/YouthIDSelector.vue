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
            open-direction="bottom"
            :internal-search="false"
            @search-change="val => search_term = val"
            :show-labels="false"
            :block-keys="['Tab', 'Enter']"
            :preserveSearch="true"
            :loading="is_busy"
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

    const SPECIAL_CHARS = [
        // Reasonable Vowels
        {special: "æ", regular: "ae", display: true,  show_caps: true},
        {special: "œ", regular: "oe", display: true,  show_caps: true},
        {special: "ø", regular: "o",  display: false, show_caps: true},

        // Reasonable Consonants
        {special: "ð", regular: "d",  display: true,  show_caps: true},
        {special: "ɖ", regular: "d",  display: false, show_caps: true},
        {special: "þ", regular: "th", display: true,  show_caps: true},
        {special: "ß", regular: "ss", display: true,  show_caps: false},

        // Letters with strokes - Not caught by diacritic filter
        {special: "ł", regular: "l",  display: false, show_caps: true},
        {special: "ħ", regular: "h",  display: false, show_caps: true},
        {special: "đ", regular: "d",  display: false, show_caps: true},
        {special: "ŧ", regular: "t",  display: false, show_caps: true},

        // Questionable Letters - Probably overkill, but why not?
        {special: "ı", regular: "i",  display: false, show_caps: false},
        {special: "ĳ", regular: "ij", display: false, show_caps: true},
        {special: "ŋ", regular: "ng", display: false, show_caps: true},
        {special: "ĸ", regular: "k",  display: false, show_caps: false},
        {special: "ſ", regular: "s",  display: false, show_caps: false},
    ].sort(
        (a, b) => a.regular.localeCompare(b.regular)
    );

    const FIELDS = ["First Name", "Last Name", "ID"];

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
                default: () => FIELDS,
                validator: function(value) {
                    // Get value as singleton array if passed as string
                    let s = (Array.isArray(value)) ? value : [value];
                    // Reduce array with && to ensure all values are in FIELDS array
                    return s.reduce((a,c) => a && FIELDS.indexOf(c) !== -1, true)
                },
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

                // Filter the options
                else {

                    options = this.options.filter(opt => {

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

                        // Split each field into an array of characters, both with and without accents & special characters
                        // Resulting objects have the fields:
                        //   char: The character as-is
                        //   norm: The plaintext version of the character
                        var split = fields.map(f => this.split_special_chars(f));

                        // If the number of terms exceeds the number of fields, no match
                        if (num_terms > fields.length) {
                            return null;
                        };

                        // Create a matrix of arrays representing which the indices at which each term can be found in each field.
                        // If the term and field don't match, the default value is an empty array.
                        // Rows are fields, columns are terms
                        // TODO: This will not match mixed special and plaintext characters
                        let matched_fields = match_matrix(split, terms, (field, term) => {

                            // Get indices of the search term in the plaintext version of the field
                            let norm = field.map(f => f.norm);
                            let norm_i = arr_indices(norm, term);

                            // Get indices of the search term in the field with special characters and accents included
                            let char = field.map(f => f.char);
                            let char_i = arr_indices(char, term);

                            // Merge these into one array, discarding duplicate values
                            // Using both allows both plaintext characters and special characters in the search term to match special characters in the field, whereas special characters in the search term do not match plaintext characters in the field.
                            // That is, searching for "e" should return accented "e"s as well as plain "e"s, but searching for an accented "e" should only match instances of "e" with the same accent.
                            return unique_i(norm_i, char_i);
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
                        // If either of these conditions is not met, filter this option out.
                        if ((unmatched_terms.length !== 0) || (num_fields_matched < num_terms)) {
                            return false;
                        };

                        // All options past this point do match the search.

                        // Initialize a new object to store the display version of the option
                        // The display version will be broken up to indicate where the matches are, so they can be highlighted
                        var opt_display = {};

                        // Cycle through each key in the option - First Name, Last Name, ID
                        obj_fields.forEach((key, n) => {

                            // Initialize an array to store the marked field string
                            let new_str = [];

                            // Combine all the match indices for the current term, removing duplicates
                            let all_indices = unique_i(concat_all(matched_fields[n]));

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
                                .concat([[split[n].length,0]]);

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
                            let id = opt["ID"];

                            if (displays[id] == null) {
                                displays[id] = {};
                            }

                            if (displays[id][key] == null) {
                                displays[id][key] = new_str;
                            }
                            else {
                                displays[id][key] = displays[id][key]
                                    .concat({seg: " ", mark: false})
                                    .concat(new_str);
                            }

                            // Helper function to take a slice of the field (which is the string version broken into individual accented characters) and mark it accordingly. Note that if the slice is blank, nothing needs to be added.
                            // TODO: Write this more cleanly
                            function add_segment(start, end, mark) {
                                if (end - start > 0) {
                                    new_str.push({
                                        seg: split[n].slice(start,end).map(c => c.char).join(""),
                                        mark
                                    });
                                }
                            };
                        });

                        // Return the new option, consisting of the Real and Display fields
                        return true;
                    });

                    options = options.sort(this.sort_options(displays));
                }

                // Stop the loading icon
                this.is_busy = false;

                // Return the options and displays as one object
                return {options, displays};


                // =-= Helper Functions =-=-=

                // Convert two arrays (rows, cols) into a matrix of booleans, where each cell represents whether the given row value and column value match according to some specified matching function (match).
                function match_matrix(rows, cols, match) {
                    return rows.map(row => cols.map(col => match(row, col)));
                };

                // Given some number of arrays, each storing arrays of the form [start_index, length], returns a new array where all duplicate start indices are replaced with a single entry containing the greatest length that index had been paired with.
                // That is, merges arrays and removes duplicates, and in case of conflicting lengths, chooses the longest.
                function unique_i(...arrs) {

                    // Init a new object which will store the max length for each index
                    let inds = {};

                    // Loop through each input
                    arrs.forEach(arr => {

                        // For each entry in the array, add it to the object if it doesn't already exist, or if it does, replace its length value if applicable.
                        arr.forEach(([i, len]) => {
                            inds[i] = (inds[i] == null) ? len : Math.max(inds[i], len);
                        });
                    });

                    // Map each key/value pair in the object (index/length) to an array
                    return Object.keys(inds).map(k => [Number(k), inds[k]]).sort();
                };

                // Flatten an array of arrays into a single array with all elements
                function concat_all(arr) {
                    return arr.reduce( (acc, curr) => acc.concat(curr) );
                };

                // Find all indices of a substring in a search string broken down into an array of substrings
                // Takes an array (arr) of strings which represents a list of segments of some full search string.
                // Returns all indices in the array where substring begins, along with the number of segments it crosses through.
                function arr_indices(arr, sub) {
                    let indices = [];
                    let arr_str = arr.join("");
                    let search_len = arr_str.length - sub.length + 1;

                    let arr_indices = [];
                    arr.forEach((item, n) => {
                        for (var i = 0; i < item.length; i++) {
                            arr_indices.push(n);
                        }
                    });

                    for (var start = 0; start < search_len; start++) {
                        let i = 0;
                        let match = true;

                        while (i < sub.length) {
                            if (sub[i].toLowerCase() != arr_str[start+i].toLowerCase()) {
                                match = false;
                                break;
                            }
                            i++;
                        }
                        if (match) {
                            var len;
                            let end = start + i - 1;

                            if (end == arr_indices.length) {
                                len = arr.length - arr_indices[start] + 1;
                            } else {
                                len = arr_indices[end] - arr_indices[start] + 1;
                            }

                            indices.push( [arr_indices[start], len] );
                        }
                    }

                    return indices;
                }
            },

            // Get a filled out array of fields from the sortBy prop
            // Pads the end of the sortBy array with any missing values from FIELDS in their default order. This ensures that all fields are considered in a sort, and allows the parent to only pass the fields it cares about sorting by, falling back on the other fields in a predefined way.
            sort_by: function() {
                // If sortBy is a string, convert it to a singleton array
                let arr = get_as_arr(this.sortBy);

                // Combine values in arr and remaining values in FIELDS which are not in arr
                return [...arr, ...FIELDS.filter(k => !arr.includes(k))];

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

                    this.using_past = periods.filter(item => item != ap && item != fp).length > 0;
                };

                // Load data from the past periods doc, only if necessary (as determined above)
                if (this.using_past) {
                    this.past_periods_doc = await this.vars_coll.doc("PastPeriods").get();
                    past_data = this.past_periods_doc.data();
                }

                // Loop through each period and add the relevant youth to the bar
                periods.forEach(function(period) {

                    // Grab the list of youth from the given period
                    var new_profiles = [];
                    switch (period) {
                        case "none":
                            new_profiles = data["NeverActiveYouths"];
                            break;
                        case ap:
                            new_profiles = data["CurrentActiveYouths"];
                            break;
                        case fp:
                            new_profiles = data["FutureActiveYouths"];
                            break;
                        default:
                            new_profiles = past_data[period];
                            break;
                    }

                    // If the given period does not exist, send a warning in the console and skip to the next period
                    if (new_profiles == undefined) {
                        console.warn("Cannot load youths from period \"" + period + "\".");
                        return;
                    }

                    // Add non-duplicate youth to the full array
                    youth_arr = youth_arr.concat(new_profiles.filter(profile => {

                        // If current profile matches any already in the list, don't include it
                        for (var i = 0; i < youth_arr.length; i++) {
                            if (profiles_equal(profile, youth_arr[i])) return false;
                        }

                        // If it didn't match any, it's a new profile, so include it
                        return true;
                    }));
                });

                // Sort the result
                youth_arr = youth_arr.sort();

                // Stop the loading icon
                this.is_busy = false;

                // Return the final result
                return youth_arr;


                // Helper function - Identify identical youth profiles
                function profiles_equal(p1, p2) {
                    // Check each field in FIELDS for a mismatch - if one is found, profiles are not equal
                    for (var f in FIELDS) {
                        if (p1[FIELDS[f]] != p2[FIELDS[f]]) return false;
                    }

                    // If all of the fields matched, profiles are equal
                    return true;
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
                    console.log("WARNING: Identical profiles found: ", a, b);
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


