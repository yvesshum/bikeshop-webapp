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