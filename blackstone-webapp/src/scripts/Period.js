// Set this to true to allow console statements for debugging purposes. Otherwise, leave as false.
var allow_console = false;

// Use console.warn, but only if allow_console is set to true
function console_warn_safe(str) {
	// eslint-disable-next-line no-console
	if (allow_console) console.warn(str);
}

// Use console.error, but only if allow_console is set to true
function console_error_safe(str) {
	// eslint-disable-next-line no-console
	if (allow_console) console.error(str, console.trace());
}

export class Period {

	// Create new Period object from season and year
	constructor(s, y) {
		this.season = s;
		this.year = y;
	}

	// Create new Period object from "Season Year" string
	static fromString(str) {
		if (str == null) return null;
		if (str.length == 0) return new Period("", "");
		var p = str.split(" ");
		return new Period(p[0], p[1]);
	}

	static makePeriod(val1, val2) {
		if (val2 == undefined) {
			return (typeof val1 == "string") ? Period.fromString(val1) : val1;
		}
		return new Period(val1, val2);
	}

	// Combine separate seasona nd year variables into properly formatted period string
	static concat(season, year) {
		return (new Period(season, year)).toString();
	}

	// Set the season list for the periods object
	static setSeasons(season_list) {
		if (Period.seasons == undefined) {
			Period.seasons = season_list;
		}
		else {
			if (Period.seasons.length != season_list.length) {
				console_warn_safe("Period Object Seasons List has been changed.", "Original: ", Period.seasons, "New: ", season_list);
			}
			for (let i in season_list) {
				if (season_list[i] != Period.seasons[i]) {
					console_warn_safe("Period Object Seasons List has been changed.", "Original: ", Period.seasons, "New: ", season_list);
				}
			}
			// season_list.map((val, i) => val == Period.seasons[i]).reduce((a,c) => a && c)
		}
		Period.seasons = season_list;
	}

	// Get the season
	getSeason() {
		return this.season;
	}

	// Get the year
	getYear() {
		return this.year;
	}

	// Obtain the season from a period string
	static season(period) {
		return Period.fromString(period).getSeason();
	}

	// Obtain the year from a period string
	static year(period) {
		return Period.fromString(period).getYear();
	}

	// Get difference between two periods
	compareTo(operand) {
		// Error handling: If no list of seasons has been assigned...
		if (Period.seasons == undefined) {
			console_error_safe("Period Seasons List has not been initialized. Please use 'Period.setSeasons()' to do so.");
			return;
		}

		var year_diff = this.year - operand.year;
		var season_diff = Period.seasons.indexOf(this.season) - Period.seasons.indexOf(operand.season);

		return (year_diff * Period.seasons.length) + season_diff;
	}

	// Compare two Period objects
	// Eg [...].sort(Period.compare)
	static compare(a, b) {
		return Period.makePeriod(a).compareTo(Period.makePeriod(b));
	}

	// Sort an array of Period objects
	// Eg Period.sort([...])
	static sort(arr) {
		return arr.sort(Period.compare);
	}

	// Get the oldest period in an array
	static oldest(arr) {
		return arr.reduce(reduce_extrema(-1));
	}

	// TRUE if a is older than b, false otherwise
	static older(a, b) {
		return Period.makePeriod(a).olderThan(Period.makePeriod(b));
	}

	// TRUE if current period object is older than given period, false otherwise
	olderThan(operand) {
		return this.compareTo(operand) < 0;
	}

	// Get the most recent period in an array
	static newest(arr) {
		return arr.reduce(reduce_extrema(1));
	}

	// TRUE if a is more recent than b, false otherwise
	static newer(a, b) {
		return Period.makePeriod(a).newerThan(Period.makePeriod(b));
	}

	// TRUE if current period object is more recent than given period, false otherwise
	newerThan(operand) {
		return this.compareTo(operand) > 0;
	}

	// Obtain the earliest and the most recent period from an array
	static range(arr) {
		return {oldest: Period.oldest(arr), newest: Period.newest(arr)};
	}

	getNext() {
		if (Period.seasons == undefined) {
			console_error_safe("Period Seasons List has not been initialized. Please use 'Period.setSeasons()' to do so.");
			return;
		}

		var index = Period.seasons.indexOf(this.season);
		var new_period;

		// If this is the last season of the year, loop around and increment the year
		if (index == Period.seasons.length - 1) {
			new_period = new Period(Period.seasons[0], (parseInt(this.year)+1).toString());
		} else {
			new_period = new Period(Period.seasons[index+1], this.year);
		}

		return new_period;
	}

	static genNext(period) {
		return Period.makePeriod(period).getNext();
	}

	getNextStr() {
		return this.getNext().toString();
	}

	static genNextStr(period) {
		let period_obj = Period.makePeriod(period);
		return period_obj == null ? null : period_obj.getNextStr();
	}

	getPrev() {
		if (Period.seasons == undefined) {
			console_error_safe("Period Seasons List has not been initialized. Please use 'Period.setSeasons()' to do so.");
			return;
		}

		var index = Period.seasons.indexOf(this.season);
		var new_period;

		// If this is the last season of the year, loop around and increment the year
		if (index == 0) {
			new_period = new Period(Period.seasons[Period.seasons.length - 1], (parseInt(this.year)-1).toString());
		} else {
			new_period = new Period(Period.seasons[index-1], this.year);
		}

		return new_period;
	}

	static genPrev(period) {
		return Period.makePeriod(period).getPrev();
	}

	getPrevStr() {
		return this.getPrev().toString();
	}

	static genPrevStr(period) {
		let period_obj = Period.makePeriod(period);
		return period_obj == null ? null : period_obj.getPrevStr();
	}

	static forEachRange(start, end, func) {
		// If start earlier than end, loop forwards
		if (Period.older(start, end)) {
			for (let i = Period.makePeriod(start); !Period.newer(i, end); i = i.getNext()) {
				func(i);
			}
		}

		// If end earlier than start, loop backwards
		else {
			for (let i = Period.makePeriod(start); !Period.older(i, end); i = i.getPrev()) {
				func(i);
			}
		}
	}

	static enumerate(start, end) {
		var arr = [];
		Period.forEachRange(start, end, period => arr.push(period));
		return arr;
	}

	static enumerateStr(start, end) {
		return Period.enumerate(start, end).map(p => p.toString());
	}

	static mapRange(start, end, func) {
		var arr = [];
		Period.forEachRange(start, end, period => arr.push(func(period)));
		return arr;
	}

	static makeMatrix(arr) {
		var result = {};
		arr.forEach(p => {
			let period = Period.makePeriod(p);
			if (result[period.getYear()] === undefined) {
				result[period.getYear()] = [];
			}
			// result[period.getYear()][period.getSeason()] = true;
			result[period.getYear()].push(period.getSeason());
		});
		return result;
	}
}

Period.prototype.toString = function() {
	return `${this.season} ${this.year}`;
};


function reduce_extrema(dir) {
	return (acc, curr) => {
		let a = Period.makePeriod(acc);
		let b = Period.makePeriod(curr);
		return (dir * Period.compare(a, b) > 0) ? a : b;
	}
}