<template>
	<div class="hours-stats-bar">
		<br />
		<div>
			<HoursDisplay :value="earned"  title="Hours Earned" :cardArgs="{'border-variant': 'success'}" />
			<span class="operator">-</span>
			<HoursDisplay :value="spent"   title="Hours Spent" :cardArgs="{'border-variant': 'danger'}" />
			<span class="operator">+</span>
			<HoursDisplay :value="pending" title="Pending Hours" :cardArgs="{'border-variant': 'warning'}" />
			<span class="operator">=</span>
			<HoursDisplay :value="balance" title="Spendable Balance"/>
		</div>
		<br />
		<div style="width: 90%; margin: auto;">
		    <b-progress class="mt-2" :max="balance" height="3rem">
		      <b-progress-bar :value="earned" variant="success" animated>Earned</b-progress-bar>
		      <b-progress-bar :value="pending" variant="warning" animated>Pending</b-progress-bar>
		      <b-progress-bar :value="spent" variant="dark"></b-progress-bar>
		    </b-progress>
		    <b-progress class="mt-2" :max="balance" height="1rem">
		      <b-progress-bar :value="earned" variant="dark"></b-progress-bar>
		      <b-progress-bar :value="pending" variant="warning" animated>Pending</b-progress-bar>
		      <b-progress-bar :value="spent" variant="dark"></b-progress-bar>
		    </b-progress>
		  </div>
	</div>
</template>

<script>

import HoursDisplay from "@/components/HoursDisplay.vue";

export default {
	name: 'hours-stats-bar',
	props: {
		profile: Object,
	},

	components: {
		HoursDisplay,
	},

	methods: {
		get_profile_field: function(field, fallback) {
			return (this.profile == null) ? fallback : this.profile.data()[field];
		},
	},

	computed: {
		earned: function() {
			return this.get_profile_field("Hours Earned", 0);
		},

		spent: function() {
			return this.get_profile_field("Hours Spent", 0);
		},

		pending: function() {
			return this.get_profile_field("Pending Hours", 0);
		},

		balance: function() {
			if (this.profile == null) return null;
			return this.earned - this.spent;
		},
	},
}
</script>

<style scoped>
	.operator {
		font-size: 2em;
	}
</style>
