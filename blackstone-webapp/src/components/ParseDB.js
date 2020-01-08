/*  Maps a two-input function of (key, value) onto an array of Objects.

	Accepts a function of the following form:

		function(name, value[, index])

	Note that the third argument is optional; that is, if the passed function only accepts
	two arguments, the index will be omitted.

	For example, the following call...

		forKeyVal([{name1: val1}, {name2: val2, name3: val3}], func)

	...will run the function "func" with the following inputs:

		func(name1, val1, 1)
		func(name2, val2, 2)
		func(name3, val3, 2)

	Intended to help parse field from the database.


	To use, include the following line:

		import {forKeyVal} from '@/components/ParseDB.js';
*/
export function forKeyVal(arr, op) {

	// Return nothing for a null array input
	if (arr == null) {
		return;
	}

	// Throw an error if the arr argument is not an Array
	if (!Array.isArray(arr)) {
		throw TypeError(`Expected array, got ${typeof arr} with value "${arr}".`);
	}

	// Map the function op onto each key/value pair
	arr.forEach((obj, n) => {
		Object.keys(obj).forEach(key => { 
			if (op.length == 2) {
				op(key, obj[key]);
			}else {
				op(key, obj[key], n);
			}
		});
	});
};



/*  Maps a two- or three-input function of (key, value[, index]) onto an array of Objects,
	returning an array of the return value of each call.

	Accepts a function of the following form:

		function(name, value[, index])

	Note that the third argument is optional; that is, if the passed function only accepts
	two arguments, the index will be omitted.

	For example, the following call...

		mapKeyVal([{name1: val1}, {name2: val2, name3: val3}], func)

	...will return an array with the following elements:

		func(name1, val1, 1)
		func(name2, val2, 2)
		func(name3, val3, 2)

	Intended to help parse field from the database.


	To use, include the following line:

		import {mapKeyVal} from '@/components/ParseDB.js';
*/
export function mapKeyVal(arr, op) {

	// Initialize result array
	var result = [];

	// For each name/value pair, push the result of op onto the result arrau
	forKeyVal(arr, (name, val, n) => {
		if (op.length == 2) {
			result.push(op(name, val));
		} else {
			result.push(op(name, val, n));
		}
	});

	// Return the result array
	return result;
};
