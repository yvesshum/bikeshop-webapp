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
            :block-keys="['Tab']"
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

        <b-button v-b-tooltip.hover.html="info_msg" variant="info" @click="show_info_modal" squared>?</b-button>

        <b-modal v-model="info_modal_visible" hide-footer lazy>
            <template slot="modal-title"><span style="color: black;">Character Substitutions</span></template>
            <!-- <p>Characters with diacritics, such as <b><i>é</i></b>, <b><i>ñ</i></b>, <b><i>ç</i></b>, and <b><i>ł</i></b>, may be entered without diacritics (i.e. as <b><i>e</i></b>, <b><i>n</i></b>, <b><i>c</i></b>, and <b><i>l</i></b>).</p> -->

            <p>Characters with <b>diacritics</b> or <b>accent marks</b>, such as <b><code>é</code></b>, <b><code>ñ</code></b>, <b><code>ç</code></b>, and <b><code>ł</code></b>, may be entered without diacritics (i.e. as <b><code>e</code></b>, <b><code>n</code></b>, <b><code>c</code></b>, and <b><code>l</code></b>).</p>

            <p>In addition, a large number of <b>special characters</b> may be replaced by characters from the standard US keyboard which either look similar or represent their pronunication.  These include:</p>

            <!-- <table style="margin: auto; text-align: center">
                <tbody>
                    <tr>
                        <td><b>Special Character</b></td>
                        <td></td>
                        <td><b>Search Equivalent</b></td>
                    </tr>
                    <tr v-for="char_obj in special_chars">
                        <td><b><code>
                            <span v-if="char_obj.show_caps">{{char_obj.special.toUpperCase()}}</span>{{char_obj.special}}
                        </code></b></td>
                        <td>&nbsp;⇒&nbsp;</td>
                        <td><b><code>{{char_obj.regular}}</code></b></td>
                    </tr>
                </tbody>
            </table> -->

            <table style="margin: auto; text-align: center">
                <tbody>
                    <tr>
                        <td><b>Special Character:</b></td>
                        <td v-for="char_obj in special_chars" style="padding: 0px 15px;"><b><code>
                            <span v-if="char_obj.show_caps">{{char_obj.special.toUpperCase()}}</span>{{char_obj.special}}
                        </code></b></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td v-for="char_obj in special_chars">&nbsp;⇕&nbsp;</td>
                    </tr>
                    <tr>
                        <td><b>Search Equivalent:</b></td>
                        <td v-for="char_obj in special_chars"><b><code>{{char_obj.regular}}</code></b></td>
                    </tr>
                </tbody>
            </table>

            <br />

            <p>This feature is intended to make the system inclusive to names from different linguistic backgrounds, while still making it easy to search for them on a standard US keyboard.</p>

            <p>Some example searches are as follows:</p>
            <table style="margin: auto; text-align: center">
                <tbody>
                    <tr>
                        <td><b>Search Term</b></td>
                        <td></td>
                        <td><b>Potential Matches</b></td>
                    </tr>
                    <tr>
                        <td>"<b><code>oe</code></b>"</td>
                        <td>&nbsp;⇒&nbsp;</td>
                        <td>N<span class="search_highlight">oe</span>l, Z<span class="search_highlight">oë</span>, c<span class="search_highlight">œ</span>ur</td>
                    </tr>
                    <tr>
                        <td>"<b><code>nun</code></b>"</td>
                        <td>&nbsp;⇒&nbsp;</td>
                        <td><span class="search_highlight">Núñ</span>ez, <span class="search_highlight">Nun</span>n</td>
                    </tr>
                    <tr>
                        <td>"<b><code>du</code></b>"</td>
                        <td>&nbsp;⇒&nbsp;</td>
                        <td><span class="search_highlight">Du</span>ncan, <span class="search_highlight">Đư</span>ờng, Sigrí<span class="search_highlight">ðu</span>r</td>
                    </tr>
                </tbody>
            </table>

            <br />
            <p>Note that searching for an accented character will not bring up unaccented results.</p>
            <table style="margin: auto; text-align: center">
                <tbody>
                    <tr>
                        <td><b>Search Term</b></td>
                        <td></td>
                        <td><b>Match Pattern</b></td>
                    </tr>
                    <tr>
                        <td>"<b><code>a</code></b>"</td>
                        <td>&nbsp;⇒&nbsp;</td>
                        <td style="padding: 0px 15px;"><span class="search_highlight">Á</span>lv<span class="search_highlight">a</span>rez, C<span class="search_highlight">á</span>i, S<span class="search_highlight">a</span>r<span class="search_highlight">a</span>h</td>
                    </tr>
                    <tr>
                        <td>"<b><code>á</code></b>"</td>
                        <td>&nbsp;⇒&nbsp;</td>
                        <td style="padding: 0px 15px;"><span class="search_highlight">Á</span>lvarez, C<span class="search_highlight">á</span>i, Sarah</td>
                    </tr>
                </tbody>
            </table>

        </b-modal>
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
            remove: {
                type: Array,
                default: () => [],
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

                info_modal_visible: false,
                info_msg: "This bar accepts character substitutions. Click for more info."
            }
        },

        computed: {

            special_chars: function() {
                return SPECIAL_CHARS.filter(char_obj => char_obj.display);
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

                var options_to_use =
                    this.options.filter(youth => !Youth.contains(this.remove, youth))

                // Special case: If the search term is blank, match everything
                // Note that the search function can handle this too, but in this case
                // it's easier to just do this all at once
                if (num_terms === 0) {

                    // Create the unmarked displays for each option, and return all options
                    // Since there is no search, the Display fields will all be singleton arrays where the one element is an unmarked segment representing the whole string.
                    options_to_use.forEach(opt => {
                        let temp = {};
                        Object.keys(opt).forEach(key => {
                            temp[key] = [{seg: opt[key], mark: false}];
                        });
                        displays[opt["ID"]] = temp;
                    });

                    options = options_to_use.sort(this.sort_options());
                }

                options = options_to_use.filter(option => {
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
                    // var opt_display = {};

                    Youth.requiredVals().forEach(key => {

                        var indices = valid[key].concat([[option[key].length,0]]);
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
                        }
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
                }

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

                        // If there are any duplicates within the period, send a warning
                        let duplicates = Youth.duplicates(new_profiles);
                        if (duplicates.length > 0) {
                            console.warn("Duplicate profiles found in \"" + Period.concat(season, year) + "\": ", duplicates);
                        }

                        // Add non-duplicate youth to the full array
                        // Note that this filters out duplicates within new_profiles as well as
                        // between youth_arr and new_profiles
                        youth_arr = Youth.concat_unique(youth_arr, new_profiles);
                    });
                }

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

            show_info_modal: function() {
                this.info_modal_visible = true;
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

            remove: function() {
                if (Youth.contains(this.remove, this.value)) {
                    this.value = null;
                }
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


