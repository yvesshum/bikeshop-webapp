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


// Error checking to get a Date object from the database
// Should be a Timestamp, but handles error in case it isn't
export function get_as_date(date_obj) {
  return (date_obj.toDate == undefined)
	? new Date(date_obj.seconds * 1000)
	: date_obj.toDate();
};







export class AwaitTransactions {

	// Initialize the object with reference to a given database
	constructor(database) {

		// Save the given database
		this.db = database;

		// Initialize all lists to empty
		this.transactionList = [];
		this.nameList = [];
		this.resultList = [];
		this.errList = [];

		// Initialize the return function to be undefined
		this.returnFunc = undefined;
	}


	// Create a new transaction and return its unique index
	createTransaction (name, transaction) {

		// Add the new transaction to the list
		this.transactionList.push(transaction);
		this.nameList.push(name);

		// Add null values to the results and error lists
		this.resultList.push(null);
		this.errList.push(null);
	}


	runTransactions () {

		// Don't try and run if the return function is not defined
		if (this.returnFunc == undefined) {
			console.error("This AwaitTransactions object cannot be run until it has a return function.")
			return undefined;
		}

		// If there are no transactions yet, send a warning but keep going - nothing will happen
		if (this.numTransactions == 0) {
			console.warn("No transactions have been created yet.");
		}

		// Cycle through each transaction
		this.transactionList.forEach((transaction, n) => {

			// Run the transaction with respect to the specified database
			this.db.runTransaction(transaction)

			// If the transaction succeeds, set it appropriately
			.then(result => {
			  this.resultList[n] = true;
			  this.checkForCompletion();
			})

			// Run this if the transaction fails
			.catch(err => {
			  this.resultList[n] = false;
			  this.errList[n] = err;
			  this.checkForCompletion();
			});
		});
	}

	// Gets the number of transactions
	numTransactions () {
		return this.transactionList.length();
	}

	// Pass a function to handle the results once all transactions have been received
	setReturnFunc (func) {
		if (func == null) {
			console.warn("Passing a null/undefined object as the return function.");
		}
		this.returnFunc = func;
	}

	// If all transactions have come back, run the returnFunc
	checkForCompletion () {

		// If there are no results yet, quit
		if (this.resultList.length == 0) return;

		// If there are any null values, quit
		for (let i in this.resultList) {
		  if (this.resultList[i] == null) return;
		}

		// Collect the errors and attach their names
		let errors = this.errList
			.map((err, n) => {
				return (err == null) ? null : {err, name: this.nameList[n]};
			})
			.filter(x => x != null);

		// Run the return function on the failed items
		this.returnFunc(errors);
	}
}
