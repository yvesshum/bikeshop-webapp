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



export function filter(search_term, opt) {
	return make_filter(search_term)(opt);
}

export function make_filter(search_term) {
	return (opt) => make_search(search_term)(opt) != null
};

export function search(search_term, opt) {
	return make_search(search_term)(opt);
};

export function make_search(search_term) {

	// Split search string into individual lowercase terms
    var terms = search_term.split(' ')
        .filter(s => s.length > 0)
        .map(s => s.toLowerCase());
    var num_terms = terms.length;

    // Special case: If the search term is blank, match everything
    if (num_terms === 0) {
        return (opt) => true;
    }

	return (opt) => {

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
        if (typeof opt == "string") {
        	fields = opt.split(" ");
        }
        else {
	        Object.keys(opt).forEach(key => {
	            opt[key].split(' ').filter(s => s.length > 0).forEach(s => {
	                fields.push(s);
	                obj_fields.push(key);
	            });
	        });
	    }

        // Split each field into an array of characters, both with and without accents & special characters
        // Resulting objects have the fields:
        //   char: The character as-is
        //   norm: The plaintext version of the character
        var split = fields.map(f => split_special_chars(f));

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

        // console.log(opt, "Matched Fields: ", matched_fields);

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
            return null;
        };

        return true;



        // // All options past this point do match the search.

        // // Initialize a new object to store the display version of the option
        // // The display version will be broken up to indicate where the matches are, so they can be highlighted
        // var opt_display = {};

        // // Cycle through each key in the option - First Name, Last Name, ID
        // obj_fields.forEach((key, n) => {

        //     // Initialize an array to store the marked field string
        //     let new_str = [];

        //     // Combine all the match indices for the current term, removing duplicates
        //     let all_indices = unique_i(concat_all(matched_fields[n]));

        //     // Strap in ladies and gents, this one is gonna be wild
        //     // Process the indices so they are in ascending order with no overlap.
        //     // By the end, we want to know where to start each highlight, and how long it should be.
        //     // For processing purposes later, the length of the string (the "final index") is added with a highlight length of 0. This is so that when the field string is broken into substrings, we have one final substring which reaches to the end.
        //     var indices = all_indices
        //         // Sort indices by the numerical values of their start positions
        //         .sort(([a_index, a_len], [b_index, b_len]) => a_index - b_index)
        //         // Remove any indices which would start inside another highlighted region (i.e. get rid of overlaps)
        //         .filter((curr, n, arr) => {
        //             // Keep the first index regardless
        //             if (n == 0) return true;
        //             // Return whether current index is within term length of previous index
        //             let prev = arr[n-1];
        //             return (curr[0] - prev[0] >= prev[1]);
        //         })
        //         // Add the final index with highlight length 0
        //         .concat([[split[n].length,0]]);

        //     // Use indices to cut the field into marked and unmarked substrings.
        //     for (var i in indices) {

        //         // At the beginning, add an unmarked region from the start of the string to the current index
        //         if (i == 0) {
        //             add_segment(0, indices[i][0], false);
        //         }

        //         // Otherwise, add a marked region starting at the previous index and extending for the length of the previous index, then add the remainder up to the current index as an unmarked region.
        //         // Note that because of the filtering above, we don't have to worry about the end of the marked region being larger than the current index.
        //         else {
        //             let prev_index = indices[i-1][0];
        //             let curr_index = prev_index + indices[i-1][1];
        //             let next_index = indices[i][0];

        //             add_segment(prev_index, curr_index, true);
        //             add_segment(curr_index, next_index, false);
        //         }
        //     }

        //     // Set display value for this field to the cumulative new_str array.
        //     let id = opt["ID"];

        //     if (displays[id] == null) {
        //         displays[id] = {};
        //     }

        //     if (displays[id][key] == null) {
        //         displays[id][key] = new_str;
        //     }
        //     else {
        //         displays[id][key] = displays[id][key]
        //             .concat({seg: " ", mark: false})
        //             .concat(new_str);
        //     }

        //     // Helper function to take a slice of the field (which is the string version broken into individual accented characters) and mark it accordingly. Note that if the slice is blank, nothing needs to be added.
        //     // TODO: Write this more cleanly
        //     function add_segment(start, end, mark) {
        //         if (end - start > 0) {
        //             new_str.push({
        //                 seg: split[n].slice(start,end).map(c => c.char).join(""),
        //                 mark
        //             });
        //         }
        //     };
        // });

        // // Return the new option, consisting of the Real and Display fields
        // return true;
	}
};





// =-= Helper Functions =-=-=


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
};


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
};


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

		// Add the inputs to the the container div
		container.appendChild(edit1);
		container.appendChild(edit2);

		// Minor adjustments after div loads
		onRendered(function () {
	        container.focus();
	        container.style.height = "100%";
		});

		// Callback to submit the new range for filtering when it changes
		function onChange(e) {

			// Get the new range from the inputs, replacing blank inputs with null
	        let min = edit1.value !== "" ? edit1.value : null;
	        let max = edit2.value !== "" ? edit2.value : null;
	        let new_range = {min, max};

	        // Submit the new range
	        console.log("Updating range: ", new_range);
	        success(new_range);
		}

		// Callback to submit the new range for filtering when the enter key is pressed
		function onEnter(e) {

			// Get the new range from the inputs, replacing blank inputs with null
	        let min = edit1.value !== "" ? edit1.value : null;
	        let max = edit2.value !== "" ? edit2.value : null;
	        let new_range = {min, max};

	        console.log("Updating range from enter: ", new_range);

	        switch (e.keyCode) {

				// Enter key - Submit the new range
		        case 13:
		            success(new_range);
		            break;

		        // Esc key - Cancel the range
		        case 27:
		            cancel();
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



export function custom_filter_editor(cell, onRendered, success, cancel, editorParams) {

    // Filtering options passed in through editorParams
    var ops = editorParams.operations;
    var vals = editorParams.options;

    // Basic components - the button to open the dropdown menu, and the menu itself
    var dropbtn = document.createElement("button");
    var dropdown = document.createElement("div");

    // Set starting inner text
    dropdown.innerHTML = "List of Filters:<br/>";
    dropbtn.innerText = "Show Filters";

    // Div to hold all filters
    var filter_div = document.createElement("div");
    filter_div.style = "display: block; margin: 6px;";
    dropdown.appendChild(filter_div);

    // Array of functions to get the values of each filter
    var filter_list = [];

    // Create the function to align the menu under the button
    var align_dropdown = create_align_dropdown();


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
        align_dropdown();
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

      align_dropdown();
    }
    dropdown.appendChild(add_button);


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
      hide_dropdown();

      // Submit list of filters to Tabulator
      success(filters);
    }
    dropdown.appendChild(apply_button);


    // Button to stop filtering data
    var remove_button = document.createElement("button");
    remove_button.innerText = "Remove All Filters";
    remove_button.onclick = cancel;
    dropdown.appendChild(remove_button);


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
    window.addEventListener("scroll", function(e) {
      if (dropdown.style.display == "block") {
        align_dropdown();
      }
    });

    // Add the dropdown to the page, and return the button to Tabulator
    document.body.appendChild(dropdown);
    return dropbtn;


    // Helper Functions

    // NOTE - In order for this to work, the menu must already be shown, so its bounding rectangle
    // can be calculated
    function create_align_dropdown() {

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
			    }

			    // Aligh right if possible
			    else if (btn_rect.right - men_rect.width > 0) {
			    	align_right(btn_rect, men_rect);
			    }

			    // Align centered to the window if necessary
			    else {
			    	dropdown.style.left = ((window.innerWidth - menu_rect.width) / 2) + "px";
			    }
      		}
      }

      function align_left(btn_rect, men_rect) {
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
    };

    function show_dropdown() {
      dropdown.style.display = "block";
      dropbtn.innerText = "Hide Filters";
    }

    function hide_dropdown() {
      dropdown.style.display = "none";
      dropbtn.innerText = "Show Filters";
    }
}
