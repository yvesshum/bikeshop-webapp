<template>
	<div>
		<div v-if="ready">
			<top-bar />
			<h1>Class Email Lookup</h1>
			<div>
				<div style="margin: 0 auto; width: 30rem">
					<p>Select class:</p>
					<SpecialInput inputType="Class" v-model="selectedClass" />
					<br />
					<p>Select period:</p>
					<SpecialInput inputType="Period" v-model="selectedPeriod" />

					<br />
					<b-button
						@click="lookupClassEmail"
						:disabled="
							lookupLoading || selectedClass == null || selectedPeriod == null
						"
						>Search</b-button
					>
				</div>

				<br />

				<b-table
          style="margin: 1rem 0 2rem"
					:items="emails[`${this.selectedClass} ${this.selectedPeriod}`]"
					show-empty
                    :busy="lookupLoading"
				>
                    <template v-slot:table-busy>
                        <div class="text-center text-danger my-2">
                        <b-spinner class="align-middle"></b-spinner>
                        <strong>Loading...</strong>
                        </div>
                    </template>
				</b-table>

				<div
					v-if="
						emails[`${this.selectedClass} ${this.selectedPeriod}`] != null &&
							emails[`${this.selectedClass} ${this.selectedPeriod}`].length > 0
					"
				>
					<b-button class="copy_button" @click="copyAllEmails" variant="success"
						>Copy all emails to clipboard</b-button
					>
					<b-button class="copy_button" @click="copyPrimaryEmails" variant="info"
						>Copy primary parent emails to clipboard</b-button
					>
					<b-button class="copy_button" @click="copySecondaryEmails" variant=""
						>Copy secondary parent emails to clipboard</b-button
					>
				</div>
			</div>
			<Footer />
		</div>
		<div v-else class="loading">
			<b-spinner />
		</div>
	</div>
</template>
<script>
import SpecialInput from "../../components/SpecialInput";
import { initSpecialInputVal } from "../../scripts/SpecialInit";
import { db } from "@/firebase.js";

export default {
	name: "EmailLookup",
	components: {
		SpecialInput,
	},
	data() {
		return {
			ready: true,
			selectedClass: initSpecialInputVal("Class"),
			selectedPeriod: initSpecialInputVal("Period"),

			emails: {},
			lookupLoading: false,
		};
	},
	methods: {
		copyAllEmails() {
            let copyText = ""
			let key = `${this.selectedClass} ${this.selectedPeriod}`;

            this.emails[key].forEach(item => {
                copyText += item.primary_parent_email
                copyText += ' '
                copyText += item.secondary_parent_email
                copyText += ' '
            })
			this.$copyText(copyText).then(() => {
                window.alert("Copied!")
			});
        },
        
        copyPrimaryEmails() {
            let copyText = ""
			let key = `${this.selectedClass} ${this.selectedPeriod}`;
            this.emails[key].forEach(item => {
                copyText += item.primary_parent_email
                copyText += ' '
            })
			this.$copyText(copyText).then(() => {
                window.alert("Copied!")
			});
        },

        copySecondaryEmails() {
            let copyText = ""
			let key = `${this.selectedClass} ${this.selectedPeriod}`;

            this.emails[key].forEach(item => {
                copyText += item.secondary_parent_email
                copyText += ' '
            })
			this.$copyText(copyText).then(() => {
                window.alert("Copied!")
			});
        },

		async lookupClassEmail() {
			let key = `${this.selectedClass} ${this.selectedPeriod}`;

			if (this.emails[key] != null) {
				window.alert(
					"I've already fetched the data, if you believe there should be an update try refreshing the page"
				);
				return;
			}

			this.lookupLoading = true;
			let found = this.selectedPeriod.match(/.*(?<year>[0-9][0-9])/);
			let year = found.groups.year;
			let periodQuery = await db
				.collection("GlobalPeriods")
				.doc(year)
				.get();
			let selectedPeriodData = periodQuery.data()[this.selectedPeriod];
			if (selectedPeriodData == null) {
				this.emails[this.selectedPeriod] = null;
				this.lookupLoading = false;
				return;
			}
			let youthIDs = selectedPeriodData
				.filter((x) => x.Class === this.selectedClass)
				.map((x) => x.ID);

			// Query each youthID profile for the emails
			let youthProfiles = await Promise.all(
				youthIDs.map(async (id) => {
					let profile = await db
						.collection("GlobalYouthProfile")
						.doc(id)
						.get();
					if (!profile.exists) {
						console.error(`Youth profile with ID does not exist: ${id}`); // eslint-disable-line no-console
						return;
					}
					return { ...profile.data(), id: profile.id };
				})
			);

			// Format data into b-table format
			// Youth ID, youth name, primary email, secondary email
			let formattedTableData = youthProfiles.map((profile) => {
				// Add the data to be copied

				return {
					ID: profile.id,
					name: `${profile["First Name"]} ${profile["Last Name"]}`,
					primary_parent_email: profile["Primary Parent or Guardian Email"],
					secondary_parent_email: profile["Secondary Parent or Guardian Email"],
				};
			});

			this.emails[
				`${this.selectedClass} ${this.selectedPeriod}`
			] = formattedTableData;

			this.lookupLoading = false;
		},
	},
	async monuted() {
		//
	},
};
</script>

<style scoped>
.copy_button {
  margin: 5px;
}
</style>
