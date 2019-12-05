
<template>
    <div class="period-classes-display">
        <div v-if="youth != undefined">
            <span class="full_name">{{youth_name}}</span>&nbsp;
            <span class="id_parens">(ID: {{youth_id}})</span>
        </div>
        
        <br />

        <div v-if="detail_view != undefined">
            <table style="width: 100%; text-align: center;">
                <tr>
                    <td style="width:50%;">Currently Active?</td>
                    <td style="width:50%;">Registered for next quarter?</td>
                </tr>
                <tr>
                    <td>{{ is_active(cur_period) ? "&#9745;" : "&#9744;" }}</td>
                    <td>{{ is_active(reg_period) ? "&#9745;" : "&#9744;" }}</td>
                </tr>
            </table>
        </div>

        <table class="table table-bordered">
            <thead>
            <tr>
                <th scope="col">Year</th>
                <th scope="col" v-for="s in seasons" :class="get_header_classes(s)">{{s}}</th>
            </tr>
            </thead>
            <tbody @mouseleave="dehover_cell">
            <tr v-for="year in years">
                <th scope="row" :class="get_header_classes(year)">20{{year}}</th>
                <td v-for="s in seasons"
                    @mouseover="hover_cell(s, year)"
                    @click="select_cell(s, year)"
                    style="cursor:pointer; text-align: left;"
                    :class="get_cell_classes(s, year)"
                >
                    <span v-if="is_active_sy(s, year)">&#9745; {{get_class_sy(s,year)}}</span>
                    <span v-else>&#9744;</span>
                </td>
            </tr>
            </tbody>
        </table>

        <div v-if="detail_view != undefined && display.length > 0">
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
    props: ['youth', 'active_periods', 'seasons', 'cur_period', 'reg_period', "class_list", "detail_view"],

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

        get_cell_classes: function(season, year) {
            var sel = this.selected == `${season} ${year}`;
            var hov = this.hover == `${season} ${year}`;

            if (sel) {
                return hov ? "table-hov-sel" : "table-sel" ;
            }
            else {
                return hov ? "table-hov" : "" ;
            }
        },

        get_header_classes: function(val) {
            var hov = this.split_period_name(this.hover);
            var match_hov = (val == hov.year || val == hov.season);
            var match_sel = false;

            if (this.selected.length > 0) {
                let sel = this.split_period_name(this.selected);
                match_sel = (val == sel.year || val == sel.season);
            }

            if (match_sel) {
                return match_hov ? "table-hov-sel" : "table-sel" ;
            }
            else {
                return match_hov ? "table-hov" : "" ;
            }
        }
    },
}
</script>
<style>
    table.table th.table-hov, table.table td.table-hov {
      background-color: #DFDFDF;
      /*background-color: #BBB;*/
    }

    table.table th.table-sel, table.table td.table-sel {
      background-color: #CBE0FE;
      /*background-color: #9ABCEA;*/
    }

    table.table th.table-hov-sel, table.table td.table-hov-sel {
      background-color: #B2C4DE;
      /*background-color: #769BCC;*/
    }

</style>