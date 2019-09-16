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
	if (arr == null) {
		return;
	}
	if (!Array.isArray(arr)) {
		throw TypeError(`Expected array, got ${typeof arr} with value "${arr}".`);
	}
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