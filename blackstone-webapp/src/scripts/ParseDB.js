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

		[
			func(name1, val1, 1),
			func(name2, val2, 2),
			func(name3, val3, 2)
		]

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


/* Maps a one- or two-input function onto the key/value pairs of an Object.

	For example, the following call:

		mapObj( {a: 1, b: 2, c: 3}, (key, val) => {return {key: key + "2", value: val * 2}} )

	...will return the following:

		{a2: 2, b2: 4, c2: 6}

	Single-argument functions should return the new value for that key.

	Two-argument functions should return an object with the fields "key" and "value".
	If a two argument function returns undefined, that key will be deleted from the object.

*/
export function mapObj(object, f) {
  Object.keys(object).forEach(key => {

	// For a single argument function, just apply f to each value
	if (f.length == 1) {
		object[key] = f(object[key])
	}

	// For a double argument function, delete the field on an undefined value,
	// otherwise set the returned key to the returned value and remove the old
	// key if it's been changed
	else {

		// Obtain the mapped value by applying the given function
		let new_obj = f(key, object[key]);

		// If the function returns undefined, delete the key/value
		if (new_obj === undefined) {
			delete object[key];
		}

		// If not, update the value
		else {
			// Delete the old field if applicable
			if (new_obj.key !== key) {
				delete object[key];
			}

			// Add/set the new field
			object[new_obj.key] = new_obj.value;
		}
	}
  });
}


export function forEach_ObjObjArr(obj, f) {
	if (obj == null) return;
	Object.keys(obj).forEach(level1 => {

		if (obj[level1] == null) return;
		Object.keys(obj[level1]).forEach(level2 => {

			if (obj[level1][level2] == null) return;
			for (let index in obj[level1][level2]) {
				f(level1, level2, index, obj[level1][level2][index]);
			}
		});
	});
};


// Error checking to get a Date object from the database
// Should be a Timestamp, but handles error in case it isn't
export function get_as_date(date_obj) {
  return (date_obj.toDate == undefined)
	? new Date(date_obj.seconds * 1000)
	: date_obj.toDate();
};
