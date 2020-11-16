export const SPECIAL_CHARS = [
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



// The parameter full_object is included for compliance with Tabulator
export function filter(search_term, option, full_object, search_params) {
    return make_filter(search_term, search_params)(option);
}

export function make_filter(search_term, search_params) {
    return (option) => make_search(search_term, {...search_params, just_filter: true})(option);
}

export function search(search_term, option, search_params) {
    return make_search(search_term, search_params)(option);
}

export function make_search(search_term, search_params) {

    // Split search string into individual lowercase terms
    var terms = search_term.split(' ')
        .filter(s => s.length > 0)
        .map(s => s.toLowerCase());
    var num_terms = terms.length;

    // Special case: If the search term is blank, match everything
    if (num_terms === 0) {
        return (opt) => true;  // eslint-disable-line no-unused-vars
    }

    return (opt) => {

        var fields_to_search = (search_params != undefined && search_params["fields"] != undefined)
            ? search_params["fields"] : Object.keys(opt);

        // Split input into individual words/terms, along with the index where that word begins
        // and the key it came from (if input is an object).
        // This will catch fields with multiple words, eg a middle name.
        // 
        // Example result for string input "John":
        //      [ {norm: "john", char: "John", index: 0}, ... ]
        // 
        // Example result for object input {"First Name": "John"}:
        //      [ {norm: "john", char: "John", index: 0, key: "First Name"} ... ]
        // 
        var fields = [];
        if (typeof opt == "string") {
            fields = string_to_search(opt);
        }
        else {

            // Loop through each searchable field in the input object
            fields_to_search.forEach(key => {

                // Concatenate the results of string_to_search with existing fields,
                // adding the key each came from in the original object
                string_to_search(opt[key]).forEach(str => {
                    str["key"] = key;
                    fields.push(str);
                });
            });
        }

        // If the number of terms exceeds the number of fields, no match
        if (num_terms > fields.length) {
            return null;
        }

        // In each object, add the field "matches" to store the indices at which a term can be found
        // Produce a boolean matrix for whether a given term matches a given field
        // Rows are fields, columns are terms
        // TODO: This will not match mixed special and plaintext characters
        let matched_fields = match_matrix(fields, terms, (field, term) => {

            // Get indices of the search term in the plaintext version of the field
            let norm = field.chars.map(f => f.norm);
            let norm_i = arr_indices(norm, term);

            // Get indices of the search term in the field with special characters and accents included
            let char = field.chars.map(f => f.char);
            let char_i = arr_indices(char, term);

            // Merge these into one array, discarding duplicate values
            // Using both allows both plaintext characters and special characters in the search term to match special characters in the field, whereas special characters in the search term do not match plaintext characters in the field.
            // That is, searching for "e" should return accented "e"s as well as plain "e"s, but searching for an accented "e" should only match instances of "e" with the same accent.
            let matches = unique_i(norm_i, char_i).map(([i,l]) => [i + field.index, l]);

            // If the search term matched any part of the field, record those matches
            // and mark this entry of the matrix with true
            if (matches.length > 0) {
                if (field["matches"] == undefined) {
                    field["matches"] = [];
                }
                field["matches"] = field["matches"].concat(matches);
                return true;
            }

            // If there were no matches, mark this entry of the matrix with false
            return false;
        });

        // Calculate how many of the fields are matched by at least one term
        // Find how many rows of the matrix contain at least one true value
        let num_fields_matched = matched_fields.reduce(
            // Increment the accumulator for each matrix row that has at least one non-empty array
            // The 0 on the end starts the accumulator from 0 - this is important
            (acc, curr) => acc + (curr.includes(true) ? 1 : 0), 0
        );

        // Create an array of terms which don't match any field
        // Find how many columns contain no true values
        let unmatched_terms = terms.filter((term, n) => {
            // Grab each matrix row's value at the current term's index (i.e. the indices where the term can be found in the row's field) and combine all these values with OR (such that if any value in this term's column is non-empty, the result will be true). Then, return it inverted for filter.
            // Equivalent to "false || matched_fields[0][n] || matched_fields[1][n] || ..."
            return !matched_fields.reduce((acc, curr) => acc || curr[n], false);
        });

        // The current option should match the search if:
        //
        //  - There are no terms which don't match any field
        //  - The total number of terms is not greater than than the number of fields with a matching term. If it were greater, then two terms would have to match the same field.
        //
        // If either of these conditions is not met, filter this option out.
        if ((unmatched_terms.length !== 0) || (num_fields_matched < num_terms)) {
            return search_params.just_filter ? false : null;
        }

        // All options past this point do match the search.

        // If user just wants to filter options, return true now instead of performing the following calculations
        if (search_params.just_filter) {
            return true;
        }

        // Initialize a variable to store the matches
        // This will mirror the structure of the original input:
        //   - If input was a string, it will be an array of indices
        //   - If input was an object, it will be an object with the same field names,
        //       each of which will be an array of indices for the value of that field
        var matches;

        // Construct matches array for string input
        if (typeof opt == "string") {
            var all_indices = concat_all(fields.map(field => field.matches));
            matches = (search_params.remove_overlap)
                ? remove_overlap_i(all_indices)
                : all_indices.sort(make_compare_i(false));
        }

        // Construct matches object for object input
        else {

            // Initialize matches to new object
            matches = {};

            // Set matches up to mimic the orignal object, where each key from the original
            // is associated with the array of all the matches found within it
            fields.forEach(field => {

                // If matches doesn't contain this field's key yet, add it
                if (matches[field.key] == undefined) {
                    matches[field.key] = [];
                }

                // If this field had any matches, add them to matches
                if (field.matches != undefined) {
                    matches[field.key] = matches[field.key].concat(field.matches);
                }
            });


            // For each key, sort the indices and remove any overlaps if desired
            if (search_params.remove_overlap) {
                Object.keys(matches).forEach(key => {
                    matches[key] = remove_overlap_i(matches[key]);
                });
            }
            else {
                Object.keys(matches).forEach(key => {
                    matches[key] = matches[key].sort(make_compare_i(false));
                });
            }
        }

        // Return the matches array/object
        return matches;
    }
}





// =-= Helper Functions =-=-=


function string_to_search(str) {
    var result = [];

    for (let i = 0; i < str.length; i++) {

        // Set index to the start of the next word, and i to the end of that word
        while (str[i] == ' ') i++;
        let index = i;
        while (str[i] != ' ' && i < str.length) i++;

        // Split the word into an array of characters, both with and without accents and
        // special characters, and add it to result. Resulting objects have the fields:
        //   char: The character as-is
        //   norm: The plaintext version of the character
        result.push({
            index, chars: split_special_chars(str.substring(index, i))
        });
    }

    return result;
}


// Split a string into characters stored as objects, where each object contains:
//   char: The character as-is, along with all accents
//   norm: The lowercase plaintext version of the character
export function split_special_chars(str) {

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
            let norm = parse_text(char.toLowerCase(), {
                accents: "none",
                special: false
            });
            ret.push({char, norm});
        }
    });

    // Return the return array
    return ret;
}


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
export function parse_text(str, options) {
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
    }

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
    }
}


// Convert two arrays (rows, cols) into a matrix of booleans, where each cell represents whether the given row value and column value match according to some specified matching function (match).
function match_matrix(rows, cols, match) {
    return rows.map(row => cols.map(col => match(row, col)));
}

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
}

// Given an array of indices, remove any index which overlaps an earlier index
function remove_overlap_i(indices) {

    var new_indices = [];

    // Sort indices by the numerical values of their start positions, then filter out overlaps
    indices.sort(make_compare_i(true)).forEach((curr, n, arr) => { // eslint-disable-line no-unused-vars

        // Keep the first index regardless
        if (n == 0) new_indices = [curr];

        // Keep the current index if it is not within the length of the most recent included index
        let prev = new_indices[new_indices.length-1];
        if (curr[0] - prev[0] >= prev[1]) {
            new_indices.push(curr);
        }
    });

    return new_indices;
}

// Compare two indices for sorting the array
// If start positions are different, sort earlier indices first
// If start positions are the same:
//   - If longer_first is true, put the index with the greater length first
//   - Otherwise, put the index with the smaller length first
function make_compare_i(longer_first) {

    // Return a comparison function
    return ([a_index, a_len], [b_index, b_len]) => {
        var diff = a_index - b_index;
        if (diff === 0) {
            return longer_first ? (b_len - a_len) : (a_len - b_len);
        }
        else {
            return diff;
        }
    }
}

// Flatten an array of arrays into a single array with all elements
function concat_all(arr) {
    return arr.reduce( (acc, curr) => acc.concat(curr) );
}

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







// NOTE: Any column using this filter should set the field "HeaderFilterLiveFilter" to false in the header
export function make_range_editor(type) {
    return (cell, onRendered, success, cancel, editorParams) => {

        // Create the container element for the inputs
        var container = document.createElement("div");

        // Create the minimum input
        var edit1 = document.createElement("input");
        edit1.type = type;
        edit1.placeholder = "min...";
        edit1.style = "padding: 3px; width: 50%; box-sizing: border-box;";
        edit1.classList.add("tabulator-header-filter");

        // Create the maximum input
        var edit2 = document.createElement("input");
        edit2.type = type;
        edit2.placeholder = "max...";
        edit2.style = "padding: 3px; width: 50%; box-sizing: border-box;";
        edit2.classList.add("tabulator-header-filter");

        // Set the minimum possible value, if applicable
        if (editorParams.minimum != undefined) {
            edit1.min = editorParams.minimum;
            edit2.min = editorParams.minimum;
        }

        // Set the maximum possible value, if applicable
        if (editorParams.maximum != undefined) {
            edit1.max = editorParams.maximum;
            edit2.max = editorParams.maximum;
        }

        if (editorParams.step != undefined) {
            edit1.step = editorParams.step;
            edit2.step = editorParams.step;
        }

        // Add the inputs to the the container div
        container.appendChild(edit1);
        container.appendChild(edit2);

        // Minor adjustments after div loads
        onRendered(function () {
            container.focus();
            container.style.height = "100%";
        });

        // Callback to submit the new range for filtering when it changes
        function onChange(e) { // eslint-disable-line no-unused-vars

            // Get the new range from the inputs, replacing blank inputs with null
            let min = edit1.value !== "" ? edit1.value : null;
            let max = edit2.value !== "" ? edit2.value : null;

            // If neither input has a value, clear the filter
            // Otherwise, save the range as a new filter
            let new_range = (min == null && max == null) ? null : {min, max};

            // Submit the new range
            success(new_range);
        }

        // Callback to submit the new range for filtering when the enter key is pressed
        function onEnter(e) {

            // Get the new range from the inputs, replacing blank inputs with null
            let min = edit1.value !== "" ? edit1.value : null;
            let max = edit2.value !== "" ? edit2.value : null;

            // If neither input has a value, clear the filter
            // Otherwise, save the range as a new filter
            let new_range = (min == null && max == null) ? null : {min, max};

            switch (e.keyCode) {

                // Enter key - Submit the new range
                case 13:
                    success(new_range);
                    break;

                // Esc key - Cancel the range
                case 27:
                    success(null);
                    break;
            }

            return;
        }

        // Submit new value on blur or change
        edit1.addEventListener("change", onChange);
        edit1.addEventListener("blur",   onChange);
        edit2.addEventListener("change", onChange);
        edit2.addEventListener("blur",   onChange);

        // Submit new value on enter
        edit1.addEventListener("keydown", onEnter);
        edit2.addEventListener("keydown", onEnter);

        // Return the container element
        return container;
    };
}



export function custom_filter_button(cell, onRendered, success, cancel, editorParams) {

    var dropbtn = document.createElement("button");

    // Set starting inner text
    dropbtn.innerText = "Show Filters";

    // Styling
    dropbtn.style = `
      background-color: white;
      padding: 5px 0px;
      border: none;
      width: 100%;
    `;

    editorParams.dropdown_body.set_success(success);

    // Function to open/close the filter dropdown
    dropbtn.onclick = function() {

      var body = editorParams.dropdown_body.get_body();

      body.align(dropbtn);

      // Toggle whether dropdown is displayed
      if (!body.is_showing()) {
        show_dropdown();
      }
      else {
        hide_dropdown();
      }
    };

    return dropbtn;

    function show_dropdown() {
      editorParams.dropdown_body.get_body().show();
      dropbtn.innerText = "Hide Filters";
    }

    function hide_dropdown() {
      editorParams.dropdown_body.get_body().hide();
      dropbtn.innerText = "Show Filters";
    }
}



export function custom_filter_editor(cell, onRendered, success, cancel, editorParams) {

    // Filtering options passed in through editorParams
    var ops = editorParams.operations;
    var vals = editorParams.options;

    // Create the dropdown menu
    var dropdown = make_dropdown_blank(editorParams);

    // Add some initial text to the dropdown body
    dropdown.menu.innerHTML = "List of Filters:<br/>";

    // Div to hold all filters
    var filter_div = document.createElement("div");
    filter_div.style = "display: block; margin: 6px;";
    dropdown.append(filter_div);

    // Array of functions to get the values of each filter
    var filter_list = [];


    // Button to add new filters
    var add_button = document.createElement("button");
    add_button.innerText = "Add Filter";
    add_button.onclick = function() {

      // Create a div to contain the new filter
      let new_filter = document.createElement("div");

      // Create all the child elements of the new filter
      let rem_button = document.createElement("button");
      let check = document.createElement("input");
      let select_val = document.createElement("select");
      let select_op =  document.createElement("select");
      let input1 = document.createElement("input");
      let input2 = document.createElement("input");
      let incl_div = document.createElement("div");


      // Variable to tell whether certain inputs are needed
      let second_input_active = false;
      let inclusive_active = false;

      // Helper function to get the name of an option
      var getname = (option) => (typeof option == "string") ? option : option.name;


      // X button to delete this filter
      rem_button.innerText = "×";
      rem_button.onclick = function() {
        check.checked = false;
        filter_div.removeChild(new_filter);
        dropdown.align();
      };

      // Checkbox to enable/disable specific filters
      check.type = "checkbox";
      check.style.margin = "auto 15px";
      check.checked = true;

      // Box to select which option to search
      select_val.innerHTML = `${vals.map(o => `<option value='${getname(o)}'>${getname(o)}</option>`)}`;

      // Box to select the operation to use to filter
      select_op.innerHTML = `${ops.map(o => `<option value='${getname(o)}'>${getname(o)}</option>`)}`;
      select_op.onchange = function() {
        let o = ops.filter(opt => getname(opt) == this.value)[0];
        if (typeof o != "string" && o.num_inputs == 2) {
            input1.after(input2);
            second_input_active = true;
        }
        else if (new_filter.contains(input2)) {
            new_filter.removeChild(input2);
            second_input_active = false;
        }

        if (typeof o != "string" && o.inclusive) {
            new_filter.appendChild(incl_div);
            inclusive_active = true;
        }
        else if (new_filter.contains(incl_div)) {
            new_filter.removeChild(incl_div);
            inclusive_active = false;
        }

        dropdown.align();
      };

      select_op.style = "margin-left: 3px;";
      input1.style = "width: 8em; margin-left: 3px;";
      input2.style = "width: 8em; margin-left: 3px;";

      // Create a checkbox for inclusive ranges
      incl_div.style = "display: inline-block; margin-left: 6px;";
      let incl_check = document.createElement("input");
      incl_check.type = "checkbox";
      let incl_message = document.createElement("div");
      incl_message.innerHTML = " Inclusive?";
      incl_message.style.display = "inline-block";
      incl_div.appendChild(incl_check);
      incl_div.appendChild(incl_message);


      // Add a function to get the data from this filter to the master list of filters
      filter_list.push(() => {
        return {
            active: check.checked,
            option: select_val.value,
            op:     select_op.value,
            value:  input1.value,
            value2: second_input_active ? input2.value : undefined,
            inclusive: inclusive_active ? incl_check.checked : undefined,
        }
      });


      // Apppend all the features to the filter div
      new_filter.appendChild(rem_button);
      new_filter.appendChild(check);
      new_filter.appendChild(select_val);
      new_filter.appendChild(select_op);
      new_filter.appendChild(input1);

      // Add the filter to the dropdown
      filter_div.appendChild(new_filter);

      dropdown.align();
    }
    dropdown.append(add_button);


    // Button to apply the filters to the data
    var apply_button = document.createElement("button");
    apply_button.innerText = "Apply Filters"
    apply_button.onclick = function() {

      // Loop through filter list, which stores functions to get the value of each filter
      var filters = [];
      filter_list.forEach(filter_gen => {
        let filter = filter_gen();
        if (filter.active) {
            filters.push(filter);
        }
      });

      // Hide the dropdown menu so the table isn't obscured
      dropdown.hide();

      // Submit list of filters to Tabulator
      success(filters);
    }
    dropdown.append(apply_button);


    // Button to stop filtering data
    var remove_button = document.createElement("button");
    remove_button.innerText = "Stop Filtering";
    remove_button.onclick = function() {

        // Hide the dropdown menu so the table isn't obscured
        dropdown.hide();

        // Submit null as the list of filters to cancel the filtering
        // Originally submitted an empty list here, but Tabulator still treats this as a filter,
        // which means table.getFilters(true) will say it's being filtered, even though we don't
        // want it to
        success(null);
    };
    dropdown.append(remove_button);


    // Return the button to Tabulator to be placed in the header
    return dropdown.button;
}




export function custom_filter_func(filter_groups, option, row, params) {

    // Parse the desired value of the cell, if the filter parameters specify a way to format it
    var cell_val = params.get_cell_val != undefined ? params.get_cell_val(option) : option;

    // Result will be true if any of the groups passes
    return filter_groups.some(filters => {

        // Group result will be true if every filter passes
        return filters.every(filter => {

            // Parse desired value(s) from filter and actual value from user input
            var option_val = params.parse_option_val(filter.option, cell_val, filter.value);
            var filter_val = params.parse_filter_val(filter.option, filter.value);
            var second_val = params.parse_filter_val(filter.option, filter.value2);

            // If the search term was invalid for some reason, skip over this filter
            if (filter_val == null) return true;

            // By this point, option_val holds the appropriate value of the current cell,
            // and filter_val holds the desired value from the filter, e.g.
            //    option_val = 2019
            //    filter_val = 2015

            // If there are two values from the filter, package them into an array
            var filter_vals = (second_val == undefined) ? filter_val : [filter_val, second_val];

            // Get the operation with the matching name from the filter parameters
            var operation = params.operations[filter.op_index];

            // Use the fltering function provided by that operation
            return operation.filter(option_val, filter_vals, filter.inclusive);
        });
    });
}





// Make a dropdown button and menu that will align itself with the table on the page
function make_dropdown_blank(editorParams) {

    // Basic components - the button to open the dropdown menu, and the menu itself
    var dropbtn = document.createElement("button");
    var dropdown = document.createElement("div");

    // Set starting inner text
    dropbtn.innerText = "Show Filters";

    // Create the function to align the menu under the button
    var align_dropdown = create_align_function();

    // Styling
    dropbtn.style = `
      background-color: white;
      padding: 5px 0px;
      border: none;
      width: 100%;
    `;

    dropdown.style = `
      display: none;
      position: fixed;
      background-color: #f1f1f1;
      box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
      z-index: 1;
      text-align: left;
      padding: 15px;
    `;

    // Function to open/close the filter dropdown
    dropbtn.onclick = function() {

      // Toggle whether dropdown is displayed
      if (dropdown.style.display == "none") {
        show_dropdown();
        align_dropdown();
      }
      else {
        hide_dropdown();
      }
    };

    // Reposition the dropdown to stay under the button if the window is scrolled
    window.addEventListener("scroll", function(e) { // eslint-disable-line no-unused-vars
      if (dropdown.style.display == "block") {
        align_dropdown();
      }
    });

    document.body.appendChild(dropdown);
    return {
        menu:   dropdown,
        button: dropbtn,
        align:  align_dropdown,
        show:   show_dropdown,
        hide:   hide_dropdown,
        append: (x) => dropdown.appendChild(x),
    };


    // Helper Functions

    // NOTE - In order for this to work, the menu must already be shown, so its bounding rectangle
    // can be calculated
    // TODO: View modes other than the default may not work as expected
    function create_align_function() {

      // Position the menu horizontally based on the dropdown-align parameter
      switch (editorParams.dropdown_align) {

        case "left":
            return () => {
                // Get the bounding rectangles for the button and the menu
                var btn_rect = dropbtn.getBoundingClientRect();
                var men_rect = dropdown.getBoundingClientRect();
                
                // Align the top of the menu with the bottom of the button
                dropdown.style.top = btn_rect.bottom + "px";

                align_left(btn_rect, men_rect);
            }

        case "right":
            return () => {
                // Get the bounding rectangles for the button and the menu
                var btn_rect = dropbtn.getBoundingClientRect();
                var men_rect = dropdown.getBoundingClientRect();
                
                // Align the top of the menu with the bottom of the button
                dropdown.style.top = btn_rect.bottom + "px";

                align_right(btn_rect, men_rect);
            }

        case "center":
            return () => {
                // Get the bounding rectangles for the button and the menu
                var btn_rect = dropbtn.getBoundingClientRect();
                var men_rect = dropdown.getBoundingClientRect();
                
                // Align the top of the menu with the bottom of the button
                dropdown.style.top = btn_rect.bottom + "px";

                align_center(btn_rect, men_rect);
            }

        case "left-safe":
            return () => {
                // Get the bounding rectangles for the button and the menu
                var btn_rect = dropbtn.getBoundingClientRect();
                var men_rect = dropdown.getBoundingClientRect();
                
                // Align the top of the menu with the bottom of the button
                dropdown.style.top = btn_rect.bottom + "px";

                // Align left if possible, right if necessary
                if (btn_rect.right - men_rect.width < 0) {
                    align_left(btn_rect, men_rect);
                }
                else {
                    align_right(btn_rect, men_rect);
                }
            };

        case "right-safe":
            return () => {
                // Get the bounding rectangles for the button and the menu
                var btn_rect = dropbtn.getBoundingClientRect();
                var men_rect = dropdown.getBoundingClientRect();
                
                // Align the top of the menu with the bottom of the button
                dropdown.style.top = btn_rect.bottom + "px";

                // Align right if possible, left if necessary
                if (btn_rect.left + men_rect.width > window.innerWidth) {
                    align_right(btn_rect, men_rect);
                }
                else {
                    align_left(btn_rect, men_rect);
                }
            };

        case "center-screen":
            return () => {
                // Get the bounding rectangles for the button and the menu
                var btn_rect = dropbtn.getBoundingClientRect();
                var men_rect = dropdown.getBoundingClientRect();
                
                // Align the top of the menu with the bottom of the button
                dropdown.style.top = btn_rect.bottom + "px";

                let even_space = ((window.innerWidth - men_rect.width) / 2);

                // If this would be too far to the right, align left
                if (even_space > btn_rect.left) {
                    align_left(btn_rect, men_rect);
                }
                // If this would be too far to the left, align right
                else if (window.innerWidth - even_space < btn_rect.right) {
                    align_right(btn_rect, men_rect);
                }
                // Otherwise, go for it
                else {
                    dropdown.style.left = even_space + "px";
                }
            };

        case "default":
        default:
            return () => {
                // Get the bounding rectangles for the button and the menu
                var btn_rect = dropbtn.getBoundingClientRect();
                var men_rect = dropdown.getBoundingClientRect();
                
                // Align the top of the menu with the bottom of the button
                dropdown.style.top = btn_rect.bottom + "px";

                // Align left if possible
                if (btn_rect.left + men_rect.width < window.innerWidth) {
                    align_left(btn_rect, men_rect);
                    dropdown.style['white-space'] = 'nowrap';
                }

                // Aligh right if possible
                else if (btn_rect.right - men_rect.width > 0) {
                    align_right(btn_rect, men_rect);
                    dropdown.style['white-space'] = 'nowrap';
                }

                // Align centered to the window if necessary
                else {
                    dropdown.style.left = ((window.innerWidth - men_rect.width) / 2) + "px";
                    dropdown.style['white-space'] = 'normal';
                }
            }
      }

      function align_left(btn_rect, men_rect) { // eslint-disable-line no-unused-vars
        dropdown.style.left = btn_rect.left + "px";
      }

      function align_right(btn_rect, men_rect) {
        // Calculate the difference in their widths
        var diff = Math.abs(men_rect.width - btn_rect.width);
        dropdown.style.left = (btn_rect.left - diff) + "px";
      }

      function align_center(btn_rect, men_rect) {
        // Calculate the difference in their widths
        var diff = Math.abs(men_rect.width - btn_rect.width);
        dropdown.style.left = (btn_rect.left - (diff / 2)) + "px";
      }
    }

    function show_dropdown() {
      dropdown.style.display = "block";
      dropbtn.innerText = "Hide Filters";
    }

    function hide_dropdown() {
      dropdown.style.display = "none";
      dropbtn.innerText = "Show Filters";
    }
}
