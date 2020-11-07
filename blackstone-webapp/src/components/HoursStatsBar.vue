<template>
	<div class="hours-stats-bar">
		<br />
		<div style="width: 75%; margin: auto;">
			<div style="float:left;">
				<HoursDisplay :value="earned"  title="Hours Earned" :cardArgs="{'border-variant': 'success'}" />
				<span class="operator">-</span>
				<HoursDisplay :value="spent"   title="Hours Spent" :cardArgs="{'border-variant': 'danger'}" />
				<span class="operator">=</span>
				<HoursDisplay :value="balance" title="Spendable Balance" :cardArgs="{'border-variant': 'success'}" />
			</div>
			<div style="float:right">
				<HoursDisplay :value="pending" title="Pending Hours" :cardArgs="{'border-variant': 'warning'}" />
			</div>
			<div style="clear:both;"></div>
		</div>

		<br />

		<div style="width: 90%; margin: auto;">
			<b-progress class="mt-2" :max="earned" height="4rem">
				<b-progress-bar v-if="pending < 0"
					:value="Math.abs(pending)"
					variant="warning" animated
					v-b-tooltip.hover.html="pending_neg_msg"
					style="cursor: help;"
				>
					Pending<br /><i>-{{Math.abs(pending)}}</i>
				</b-progress-bar>
				<b-progress-bar
					:value="spent"
					variant="danger" animated
					v-b-tooltip.hover.html="spent_msg"
					style="cursor: help;"
				>
					Spent<br /><i>{{spent}}</i>
				</b-progress-bar>
				<b-progress-bar
					:value="balance"
					variant="success" animated
					v-b-tooltip.hover.html="spendable_msg"
					style="cursor: help;"
				>
					Spendable<br /><i>{{balance}}</i>
				</b-progress-bar>
				<b-progress-bar v-if="pending > 0"
					:value="Math.abs(pending)"
					variant="warning" animated
					v-b-tooltip.hover.html="pending_pos_msg"
					style="cursor: help;"
				>
					Pending<br /><i>+{{Math.abs(pending)}}</i>
				</b-progress-bar>
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
			if (this.profile == null) return 0;
			return this.earned - this.spent;
		},

		pending_neg_msg: function() {
			return "You've spent these hours, but an instructor still needs to confirm them."
		},

		spent_msg: function() {
			return "You've already spent these hours."
		},

		spendable_msg: function() {
			return "You've earned these hours, and can spend them."
		},

		pending_pos_msg: function() {
			return "You've earned these hours, but an instructor still needs to confirm them."
		},
	},
}
</script>

<style scoped>
	.operator {
		font-size: 2em;
	}
</style>
