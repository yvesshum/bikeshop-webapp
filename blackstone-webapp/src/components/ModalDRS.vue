<template>
	<div class="modal_drs">

		<DiscardResetSave v-show="show_buttons"
			:hasChanges="hasChanges"
			:hasUnsaveableChanges="hasUnsaveableChanges"
			:hideReset="hideReset"
			:disableIfNoChanges="disableIfNoChanges"
			:saveVariant="saveVariant"
			:resetVariant="resetVariant"
			:discardVariant="discardVariant"
			@save="save" @reset="reset" @discard="discard"
		>
		</DiscardResetSave>

		<b-modal size="lg" v-model="modal_visible" hide-footer lazy>
			<template slot="modal-header">
				<slot name="modal-header"></slot>
				<slot name="saveTitle" v-if="modal_type === 'save'">
					<h3>Confirm Changes</h3>
				</slot>
				<slot name="discardTitle" v-else-if="modal_type === 'discard'">
					<h3>Confirm Discard</h3>
				</slot>
				<slot name="resetTitle" v-else-if="modal_type === 'reset'">
					<h3>Confirm Reset</h3>
				</slot>
			</template>
			<div class="d-block text-center">
				<slot name="bodyHeader"></slot>
				<slot name="saveBody"    v-if="modal_type === 'save'"></slot>
				<slot name="discardBody" v-else-if="modal_type === 'discard'"></slot>
				<slot name="resetBody"   v-else-if="modal_type === 'reset'"></slot>
				<slot name="bodyFooter"></slot>
			</div>
			<b-button class="mt-3" block @click="acceptModal" :variant="get_variant(modal_type)">
				<div v-if="modal_type === 'save'">Save Changes</div>
				<div v-else-if="modal_type === 'reset'">Reset Changes</div>
				<div v-else-if="modal_type === 'discard'">Discard Changes</div>
			</b-button>
			<b-button class="mt-3" block @click="cancelModal" variant="primary">Continue Editing</b-button>
		</b-modal>

		<b-modal v-model="no_edit_modal_visible" hide-footer>
	    	<template slot="modal-title">
	    		No changes have been made.
	    	</template>
	    	<b-button class="mt-3" block @click="cancel_no_edit_modal" variant="primary">
	    		Continue Editing
	    	</b-button>
	    	<b-button class="mt-3" block @click="accept_no_edit_modal" variant="primary">
	    		Return to Display
	    	</b-button>
	    </b-modal>

		<b-modal v-model="success_modal_visible" hide-header>
			<h3>Success!</h3>
		</b-modal>

		<b-modal v-model="failure_modal_visible" ok-only ok-variant="outline-danger" no-close-on-backdrop no-close-on-esc hide-header-close>
			<template slot="modal-title">
				<slot name="failureModalHeader"><h4>Save Failed</h4></slot>
			</template>
			<slot name="failureModalBody">Something went wrong updating the database.</slot>
			<div slot="modal-footer">
				<div style="float: left">
					<slot name="failureModalFooter"></slot>
				</div>
				<span>&nbsp;</span>
				<div style="float: right">
					<b-button
						variant="outline-danger"
						@click="failure_modal_visible = false"
					>OK</b-button>
				</div>
			</div>
		</b-modal>
	</div>
</template>
 
<script>
import {Status} from "@/scripts/Status.js";
import DiscardResetSave from '@/components/DiscardResetSave';

export default {
	name: 'modal_drs',
	props: {
		hasChanges: Boolean,
		hasUnsaveableChanges: Boolean,
		hideReset: {
			default: false,
		},

		// Whether to display the buttons
		show: {
			default: true,
		},

		// If set, display the buttons iff there are changes
		showIfChanges: {
			default: false,
		},

		disableIfNoChanges: {
			default: false,
		},

		// Variants for the various buttons
		saveVariant: [String, Function],
		resetVariant: [String, Function],
		discardVariant: [String, Function],

		initModal: Function,
		// initModal: {
		// 	type: Function,
		// 	default: () => {},
		// },
	},
	components: {DiscardResetSave},

	data: function() {
		return {
			modal_type: null,
			modal_visible: false,

			success_modal_visible: false,
			failure_modal_visible: false,
			no_edit_modal_visible: false,
		}
	},

	computed: {
		has_saveable_changes: function() {
			return this.hasChanges;
		},

		has_any_changes: function() {
			return (this.hasChanges || this.hasUnsaveableChanges);
		},

		show_if_changes: function() {
			return this.showIfChanges === "" || this.showIfChanges == true;
		},

		show_buttons: function() {
			return this.show_if_changes ? this.has_any_changes : this.show;
		}
	},

	methods: {
		acceptModal: function() {
			this.$emit(this.modal_type, this.accept);
		},

		cancelModal: function() {
			this.modal_visible = false;
		},

		show_modal: function(type) {
			if (this.initModal != undefined) {
				this.initModal();
			}
			this.modal_type = type;
			this.modal_visible = true;
		},

		hide_modal: function() {
			this.modal_type = null;
			this.modal_visible = false;
		},

		accept_no_edit_modal: function() {
			this.no_edit_modal_visible = false;
			this.$emit("discard", this.cancel);
		},

		cancel_no_edit_modal: function() {
			this.no_edit_modal_visible = false;
		},

		save: function() {
			if (this.hasChanges) {
				this.show_modal("save");
			}
			else {
				this.no_edit_modal_visible = true;
			}
		},

		reset: function() {
			if (this.hasChanges) {
				this.show_modal("reset");
			}
			else {
				this.$emit("reset", this.cancel);
			}
		},

		discard: function() {
			if (this.hasChanges) {
				this.show_modal("discard");
			}
			else {
				this.$emit("discard", this.cancel);
			}
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

		accept: function(success) {
			console.log({success});
			if (success == undefined) {
				this.hide_modal();
			}
			else if (success) {
				this.hide_modal();
				this.success_modal_visible = true;
			}
			else {
				this.hide_modal();
				this.failure_modal_visible = true;
			}
		},

		cancel: function() {
			return;
		},
	}
}
</script>
 
<style scoped>
	.change_button {
		margin: 0px 5px;
	}
</style>
