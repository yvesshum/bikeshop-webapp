export class Youth {

	constructor(fn, ln, id) {
		this["First Name"] = fn;
		this["Last Name"] = ln;
		this["ID"] = id;
	}

	// Construct a Youth object from a Youth-like object
	static fromObject(obj) {
		return new Youth(obj["First Name"], obj["Last Name"], obj["ID"]);
	}

	// Return an array of the fields required for a complete Youth object
	static requiredVals() {
		return ["First Name", "Last Name", "ID"];
	}

	// Return true if the given object has all the required fields of a Youth object
	static isYouthLike(obj) {
		for (let val in Youth.requiredVals()) {
			if (obj[val] === undefined) {
				return false;
			}
		}
		return true;
	}

	// Concatenate the first and last name of a youth
	fullName() {
		return `${this["First Name"]} ${this["Last Name"]}`;
	}

	// Generate the full name for a given Youth-like object
	static getFullName(youth) {
		return `${youth["First Name"]} ${youth["Last Name"]}`;
	}

	// Check whether two Youth-like objects match
	static equiv(y1, y2) {
		for (var val in Youth.requiredVals()) {
			if (y1[val] != y2[val]) {
				return false;
			}
		}
		return true;
	}

	// Check whether the given list contains a match for the given Youth-like object
	static contains(list, youth) {
		for (let x in list) {
	        let curr = list[x];
	        if (Youth.equiv(curr, youth)) {
	          	return true;
	        }
	      }
	      return false;
	}

	// Get all matches for a Youth-like object in a given array
	static findMatches(list, youth) {
		return list.filter(y => Youth.equiv(youth, y));
	}
}