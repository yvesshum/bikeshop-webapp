
<template>
	<div class="hours-display">
		<b-button
			@click="show_popup"
			style="margin-bottom: 1rem"
			:variant="variant"
			:disabled="ID == null"
		>
			View Profile
		</b-button>

		<b-modal v-model="modal_visible" hide-footer lazy>
			<template slot="modal-title">
				<div class="full_name">{{youth_name}}</div>
      			<div class="id_parens">(ID: {{youth_id}})</div>
			</template>
			<div ref="body_fields" v-show="current_profile != null">
				<ProfileFields
					:profile="current_profile"
					:headerDoc="current_headers"
					:disableWarnings="true"
					:hideTitle="true"
				/>
			</div>
		</b-modal>
	</div>
</template>

<script>
// @ is an alias to /src

// Firebase
import {db} from '@/firebase';

// Components
import ProfileFields from "@/components/ProfileFields.vue"

export default {
	name: 'hours-display',
	components: {
		ProfileFields,
	},

	props: {

		// The ID of the youth to display
		ID: String,

		// The variant for the button to display the popup
		variant: {
			type: String,
			default: "info",
		},


		// Allow certain pieces from the database to be passed in as arguments
		// rather than loaded from the database directly.

		// If load... is set to false, will not load this item from the database
		// Otherwise, If nothing is passed in, will retrieve from the database

		// The youth profile to display
		loadProfile: {
			type: Boolean,
			default: true,
		},
		profile: {
			type: Object,
			default: null,
		},

		// The list of profile field headers and their data type
		// A document with the headers for the fields
		loadHeaders: {
			type: Boolean,
			default: true,
		},
		headers: {
			type: Object,
			default: null,
		},
	},

	data: function() {
		return {
			// profile_db: db.collection("GlobalYouthProfile"),
			// periods_db: db.collection("GlobalPeriods"),

			modal_visible: false,

			loaded_profile: null,
			loaded_headers: null,
		};
	},

	mounted: async function() {
    	// Load headers, if requested
		if (this.loadHeaders == true && this.headers == null) {
			await this.get_headers();
		}
	},

	methods: {

		// Display the Profile popup
		show_popup: async function() {

			// Make sure we have everything we need from the database
			await this.ensure_data_loaded();

			// Display the modal
			this.modal_visible = true;
		},


		// Ensure all required data has been loaded fromthe database, if applicable
		ensure_data_loaded: async function() {
			// Load profile, if requested
	    	if (this.loadProfile == true && this.profile == null) {
				await this.get_profile();
			}

			// Load headers, if requested
			if (this.loadHeaders == true && this.headers == null) {
				await this.get_headers();
			}
		},

		// Grab the youth profile from Firebase
		async get_profile() {
			let snapshot = db.collection("GlobalYouthProfile").doc(this.ID);
			this.loaded_profile = await snapshot.get();
		},

		// Grab the header document from Firebase
		async get_headers() {
			this.loaded_headers = await db
				.collection("GlobalFieldsCollection")
				.doc("Youth Profile")
				.get()
		},
	},

	computed: {
		youth_name: function() {
			return "Yves Shum";
		},

		youth_id: function() {
			return "10001";
		},

		// Two conditions - loadProfile bool value, profile set or not set
		// Should only load from db if it's okay to load it and no data passed from parent
		current_profile: function() {
			if (this.loadProfile == true && this.profile == null) {
				return this.loaded_profile;
			}
			else {
				return this.profile;
			}
		},

		// Two conditions - loadHeaders bool value, headers set or not set
		// Should only load from db if it's okay to load it and no data passed from parent
		current_headers: function() {
			if (this.loadHeaders == true && this.headers == null) {
				return this.loaded_headers;
			}
			else {
				return this.headers;
			}
		},
	},
}
</script>

<style scoped>
</style>