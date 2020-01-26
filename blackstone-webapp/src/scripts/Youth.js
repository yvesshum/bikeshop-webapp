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

	static isRequiredVal(val) {
		return Youth.requiredVals().includes(val);
	}

	// Return true if the given object has all the required fields of a Youth object
	static isYouthLike(obj) {
		for (let n in Youth.requiredVals()) {
			if (obj[reqs[n]] === undefined) {
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

	static getNameWithID(youth) {
		return `${youth["First Name"]} ${youth["Last Name"]} (${youth["ID"]})`;
	}

	// Check whether two Youth-like objects match
	static equiv(y1, y2) {
		var reqs = Youth.requiredVals();
		for (var n in reqs) {
			if (y1[reqs[n]] != y2[reqs[n]]) {
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

	static replace_in_array(list, youth) {
		return list.map(y => Youth.equiv(youth, y) ? youth : y);
	}

	// Get all matches for a Youth-like object in a given array
	static findMatches(list, youth) {
		return list.filter(y => Youth.equiv(youth, y));
	}

	static unique(list) {
		return list.filter((youth, i) => {
			for (let j = 0; j < i; j++) {
				if (Youth.equiv(youth, list[j])) {
					return false;
				}
			}
			return true;
		});
	}

	static duplicates(list) {
		return list.filter((youth, i) => {
			for (let j = 0; j < i; j++) {
				if (Youth.equiv(youth, list[j])) {
					return true;
				}
			}
			return false;
		});
	}

	static concat_unique(list, new_youth) {
		// Doing it this way prevents duplicates within new_youth itself from being added more than once
		new_youth.forEach(youth => {
			if (!Youth.contains(list, youth)) {
				list.push(youth);
			}
		});
		return list;

		// This one is simpler, but if new_youth contains any duplicates, they'll be added more than once
		// return list.concat( new_youth.filter(youth => !Youth.contains(list, youth)) );
	}

	static concat_overwrite(list, new_youth) {
		new_youth.forEach(youth => {
			if (Youth.contains(list, youth)) {
				Youth.replace_in_array(list, youth);
			}
			else {
				list.push(youth);
			}
		});
		return list;
	}
}