
<template>
	<div class="hours-display">
		<p class="hours-num">
			<!-- This is all on one line to prevent spaces before the decimal point... -->
			<span class="hours-whole">{{whole_component}}</span><span class="hours-decimal" v-show="!decimal_NaN">.{{decimal_component}}</span>
		</p>
		<p class="hours-name"> {{title}} </p>
	</div>
</template>

<script>

export default {
	name: 'hours-display',
	props: {

		// The name to display
		title: String,

		// The value to display
		value: Number,

		// The size of the text/div
		size: {
			type: String,
			default: "12"
		},

		// The number of decimal places to round to
		decimalPlaces: {
			type: Number,
			default: 2,
		}
	},

	methods: {
		
	},

	computed: {

		// Get the part before the decimal point, defaulting to 0 if there is none
		whole_component: function() {
			let hours = this.formatted_hours;
			let whole = hours.substring(0, hours.indexOf('.'));

			return (whole == "") ? "0" : whole;
		},

		// Get the part after the decimal point, defaulting to the appropriate number of 0s if there is none
		decimal_component: function() {
			let hours = this.formatted_hours;
			let decimal = hours.substring(hours.indexOf('.') + 1);

			return (decimal == "") ? get_0s : decimal;
		},

		// Check whether the decimal component is NaN
		decimal_NaN: function() {
			return this.decimal_component == "NaN";
		},

		get_0s: function() {
			return "0".repeat(this.decimalPlaces);
		},

		// Source: https://stackoverflow.com/questions/6134039/format-number-to-always-show-2-decimal-places
		formatted_hours: function() {
			return Number(Math.round(parseFloat(this.value + 'e' + this.decimalPlaces)) + "e-" + this.decimalPlaces).toFixed(this.decimalPlaces);
		},
	},
}
</script>

<style scoped>

	/* The div element containing each hours field (number + name) */
	.hours-display {
		display: inline-block;
		text-align: center;
		padding: 0px 15px;
	}

	/* The div element containing the entire hour number */
	.hours-num {
		font-weight: bold;
		font-family: "Courier New", Courier, monospace;
		margin: 0px;
	}

	/* The whole part of the hour number (before the decimal place) */
	.hours-whole {
		font-size: 175%;
	}

	/* The decimal part of the hour number (after the decimal place) */
	.hours-decimal {
		font-size: 1.2em;
	}

	/* The name labelling the hour number */
	.hours-name {

	}
</style>