<template>
	<div class="save_bar">

		<b-button
			:variant="discard_variant"
			:disabled="disableIfNoChanges && !has_any_changes"
			@click="discard"
			class="change_button"
		>
			Discard Changes
		</b-button>
		<b-button
			v-if="!hideReset"
			:variant="reset_variant"
			:disabled="disableIfNoChanges && !has_any_changes"
			@click="reset"
			class="change_button"
		>
			Reset Changes
		</b-button>
		<b-button
			:variant="save_variant"
			:disabled="disableIfNoChanges && !has_saveable_changes"
			@click="save"
			class="change_button"
		>
			Save Changes
		</b-button>
	</div>
</template>
 
<script>

export default {
	name: 'save_bar',
	props: {
		hasChanges: Boolean,
		hasUnsaveableChanges: Boolean,
		hideReset: {
			default: false,
		},

		disableIfNoChanges: {
			default: false,
		},

		// Variants for the various buttons
		saveVariant: [String, Function],
		resetVariant: [String, Function],
		discardVariant: [String, Function],
	},

	data: function() {
		return {
		}
	},

	computed: {
		save_variant: function() {
			if (this.saveVariant != undefined) {
				return this.saveVariant;
			}
			return this.has_saveable_changes ? "success" : "outline-success";
		},

		reset_variant: function() {
			if (this.resetVariant != undefined) {
				return this.resetVariant;
			}
			return this.has_any_changes ? "warning" : "outline-warning";
		},

		discard_variant: function() {
			if (this.discardVariant != undefined) {
				return this.discardVariant;
			}
			return this.has_any_changes ? "danger" : "outline-danger";
		},

		has_saveable_changes: function() {
			return this.hasChanges;
		},

		has_any_changes: function() {
			return (this.hasChanges || this.hasUnsaveableChanges);
		},
	},

	methods: {

		save: function() {
			this.$emit("save", this.has_saveable_changes);
		},

		reset: function() {
			this.$emit("reset", this.has_any_changes);
		},

		discard: function() {
			this.$emit("discard", this.has_any_changes);
		},

		get_variant: function(str) {
			switch (str) {
				case "save":
					return this.save_variant;
				case "reset":
					return this.reset_variant;
				case "discard":
					return this.discard_variant;
			}
			return 'outline-secondary';
		},
	}
}
</script>
 
<style scoped>
	.change_button {
		margin: 0px 5px;
	}
</style>
