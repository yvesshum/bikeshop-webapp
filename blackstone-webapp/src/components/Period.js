// Combine and split period names

// Min and max period

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

	static concat(season, year) {
		return (new Period(season, year)).toString();
	}

	static setSeasons(season_list) {
		if (Period.seasons == undefined) {
			Period.seasons = season_list;
		}
		else {
			if (Period.seasons.length != season_list.length) {
				console.warn("Period Object Seasons List has been changed.", "Original: ", Period.seasons, "New: ", season_list);
			}
			for (let i in season_list) {
				if (season_list[i] != Period.seasons[i]) {
					console.warn("Period Object Seasons List has been changed.", "Original: ", Period.seasons, "New: ", season_list);
				}
			}
			// season_list.map((val, i) => val == Period.seasons[i]).reduce((a,c) => a && c)
		}
		Period.seasons = season_list;
	}

	getSeason() {
		return this.season;
	}

	getYear() {
		return this.year;
	}

	static season(period) {
		return Period.fromString(period).getSeason();
	}

	static year(period) {
		return Period.fromString(period).getYear();
	}

	// Get difference between two periods
	compareTo(operand) {
		// Error handling: If no list of seasons has been assigned...
		if (Period.seasons == undefined) {
			console.error("Period Seasons List has not been initialized. Please use 'Period.setSeasons()' to do so.", console.trace());
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

	static oldest(arr) {
		return arr.reduce(reduce_extrema(-1));
	}

	static older(a, b) {
		return Period.makePeriod(a).olderThan(Period.makePeriod(b));
	}

	olderThan(operand) {
		return this.compareTo(operand) < 0;
	}

	static newest(arr) {
		return arr.reduce(reduce_extrema(1));
	}

	static newer(a, b) {
		return Period.makePeriod(a).newerThan(Period.makePeriod(b));
	}

	newerThan(operand) {
		return this.compareTo(operand) > 0;
	}

	static range(arr) {
		return {oldest: Period.oldest(arr), newest: Period.newest(arr)};
	}

	getNext() {
		if (Period.seasons == undefined) {
			console.error("Period Seasons List has not been initialized. Please use 'Period.setSeasons()' to do so.", console.trace());
			return;
		}

		var index = Period.seasons.indexOf(this.season);
		var new_period;

		// If this is the last season of the year, loop around and increment the year
	     if (index == Period.seasons.length - 1) {
	        new_period = new Period(Period.seasons[0], (parseInt(this.year)+1).toString());
	     } else {
	        new_period = new Period(Period.seasons[index+1], this.year);
	     };

	     return new_period;
	}

	static genNext(period) {
		return Period.makePeriod(period).getNext();
	}

	getNextStr() {
		return this.getNext().toString();
	}

	static genNextStr(period) {
		return Period.makePeriod(period).getNextStr();
	}

	getPrev() {
		if (Period.seasons == undefined) {
			console.error("Period Seasons List has not been initialized. Please use 'Period.setSeasons()' to do so.", console.trace());
			return;
		}

		var index = Period.seasons.indexOf(this.season);
		var new_period;

		// If this is the last season of the year, loop around and increment the year
	     if (index == 0) {
	        new_period = new Period(Period.seasons[Period.seasons.length - 1], (parseInt(this.year)-1).toString());
	     } else {
	        new_period = new Period(Period.seasons[index-1], this.year);
	     };

	     return new_period;
	}

	static genPrev(period) {
		return Period.makePeriod(period).getPrev();
	}

	getPrevStr() {
		return this.getPrev().toString();
	}

	static genPrevStr(period) {
		return Period.makePeriod(period).getPrevStr();
	}
};

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