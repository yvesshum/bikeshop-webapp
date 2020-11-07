<template>
	<div class="apron-earned-display">
		<Table
			:headingdata="headers"
			:table_data="achieved_info"
			@Table="handle_table"
		/>
	</div>
</template>

<script>

import Table from "@/components/Table.vue";
import {get_as_date} from "@/scripts/ParseDB.js"

export default {
	name: 'apron-earned-display',
	components: {
		Table,
	},

	props: {
		allowEdits: {
			type: Boolean,
			default: false,
		},

		loadApronInfo: {
			type: Boolean,
			default: true,
		},

		apronColors: {
			type: Array,
			default: null,
		},

		skillData: {
			type: Object,
			default: null,
		},

		achievedColor: {
			type: String,
			default: "",
		},
	},

	data: function() {
		return {
			headers: [
				{
					title: "Color", field:"color",
					sorter: this.color_sorter,
				},
				{
					title:"Achieved", field:"achieved",
					formatter: this.format_achieved_cell,
				},
			],
		};
	},

	created: async function() {
		this.$emit("load_complete", this);
	},

	methods: {
		format_achieved_cell: function(cell) {
			var val = cell.getValue();
			if (val == false) return "";
			var date = get_as_date(val);

			return date.toLocaleDateString(undefined, {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		},

		// Sorting function used by Tabulator to sort by apron color
		// All these arguments are used/provided by Tabulator, even though we don't need them for this specific function
		// eslint-disable-next-line no-unused-vars
		color_sorter: function(a, b, aRow, bRow, column, dir, sorterParams) {
			return this.get_color_index(a) - this.get_color_index(b);
		},

		get_color_index: function(color) {
			for (let i = 0; i < this.apronColors.length; i++) {
				if (this.apronColors[i].name == color) {
					return i;
				}
			}
			return -1;
		},

		handle_table: function(table) {
			this.table = table;
		},

		redraw: function() {
			this.table.redraw();
		},
	},

	computed: {
		achieved_info: function() {
			if (this.skillData == null || this.apronColors == null) return null;

			return this.apronColors.map(color_obj => {
				let color = color_obj.name;
				let foo = this.skillData[color_obj.name];
				let achieved = (foo == undefined) ? false : foo.Achieved;
				return {color, achieved};
			});
		},
	},
}
</script>

<style scoped>

</style>
