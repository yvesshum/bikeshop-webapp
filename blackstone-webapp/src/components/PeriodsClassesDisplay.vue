
<template>
    <div class="period-classes-display">
        <div>
            <span class="full_name">{{youth_name}}</span>&nbsp;
            <span class="id_parens">(ID: {{youth_id}})</span>
        </div>
        
         <br />
        <div>
            Currently active? {{ is_active(cur_period) ? "Yes" : "No" }}
        </div>
        <div>
            Registered for next quarter? {{ is_active(reg_period) ? "Yes" : "No" }}
        </div>
        <table class="table table-bordered">
            <thead>
            <tr>
                <th scope="col">Year</th>
                <th scope="col" v-for="s in seasons">{{s}}</th>
            </tr>
            </thead>
            <tbody @mouseleave="dehover_cell">
            <tr v-for="year in years">
                <th scope="row">{{year}}</th>
                <td v-for="s in seasons" @mouseover="hover_cell(s, year)" @click="select_cell(s, year)">
                    <span v-if="is_active_sy(s, year)">{{get_class_sy(s,year)}}</span>
                    <span v-else></span>
                </td>
            </tr>
            </tbody>
        </table>

        <div v-if="display.length > 0">
            <div style="float:left; width:30%">
                <font size="5">{{display}}:</font>
            </div>
            <div style="float:left;">
                <div v-if="is_active(display)">
                    <b-dropdown variant="primary" id="dropdown-text" :text="get_class(display)" class="m-2">
                        <b-dropdown-text style="width: 240px;">
                            <i>Change the status and class for {{youth_name}} in {{display}}.</i>
                        </b-dropdown-text>
                        <b-dropdown-divider></b-dropdown-divider>
                        <b-dropdown-text style="width: 240px;">
                            <i>Classes:</i>
                        </b-dropdown-text>
                        <b-dropdown-item-button v-for="c in class_list" @click="set_class(display, c)">{{c}}</b-dropdown-item-button>
                        <b-dropdown-divider></b-dropdown-divider>
                        <b-dropdown-item-button @click="set_class(display, null)">Set to inactive</b-dropdown-item-button>
                    </b-dropdown>
                </div>
                <div v-else>
                    <i>Youth was not active in {{display}}</i>
                </div>
            </div>
        </div>

        <div style="clear:both"></div>
    </div>
</template>

<script>

export default {
    name: 'period-classes-display',
    props: ['youth', 'active_periods', 'seasons', 'cur_period', 'reg_period', "class_list"],

    data: function () {
        return {
            hover: "",
            selected: "",
        }
    },

    computed: {
        period_list: function() {
            return Object.keys(this.active_periods);
        },

        years: function() {
            var min_year = this.period_list.map(this.get_period_year).reduce((acc, curr) =>
                Math.min(acc, curr)
            );
            var max_year = this.split_period_name(this.reg_period).year;
            var arr = [];

            for (let i = parseInt(max_year); i >= parseInt(min_year); i--) {
                arr.push(i.toString());
            }

            return arr;
        },

        youth_name: function() {
            return (this.youth != null) ? this.youth["Full Name"] : "";
        },

        youth_id: function() {
            return (this.youth != null) ? this.youth["ID"] : "";
        },

        display: function() {
            return (this.selected.length > 0) ? this.selected : this.hover;
        },
    },

    mounted () {

    },

    methods: {
        split_period_name: function(period) {
            var p = period.split(" ");
            return {season: p[0], year: p[1]};
        },

        get_period_year: function(period) {
            return this.split_period_name(period).year;
        },

        is_active_sy: function(season, year) {
            return this.is_active(`${season} ${year}`);
        },

        is_active: function(period) {
            return this.period_list.includes(period);
        },

        get_class_sy: function(season, year) {
            return this.get_class(`${season} ${year}`);
        },

        get_class: function(period) {
            return this.active_periods[period];
        },

        set_class: function(period, new_class) {
            this.$emit("change_period", {youth: this.youth, period, new_class});
        },

        hover_cell: function(season, year) {
            this.hover = `${season} ${year}`;
        },

        dehover_cell: function() {
            this.hover = "";
        },

        select_cell: function(season, year) {
            var temp = `${season} ${year}`;
            this.selected = (this.selected == temp) ? "" : temp;
        },
    },
}
</script>
<style>

</style>