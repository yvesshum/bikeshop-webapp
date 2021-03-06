
<template>
    <div class="period-classes-display">
        <slot>
            <div v-if="youth != undefined">
                <span class="full_name">{{youth_name}}</span>&nbsp;
                <span class="id_parens">(ID: {{youth_id}})</span>
            </div>
        </slot>
        
        <br />

        <div v-if="detail_view != undefined">
            <br />
            <table style="width: 95%; margin: auto; text-align:left;">
                <tr>
                    <td style="width:5%;">{{ is_active(cur_period) ? "&#9745;" : "&#9744;" }}</td>
                    <td style="width:45%;">Active in current quarter ({{cur_period}})</td>
                    <td style="width:5%;">{{ is_active(reg_period) ? "&#9745;" : "&#9744;" }}</td>
                    <td style="width:45%;">Registered for next quarter ({{reg_period}})</td>
                </tr>
            </table>
            <br />
            <!-- </table> -->
            <table style="width: 95%; margin: auto; text-align:left;">
                <tr>
                    <td style="width:45%; text-align:center;">
                        <span v-if="display.length == 0 || is_future_period(display)">
                            <i style="color: #999">Choose a period in the table below.</i>
                        </span>
                        <span v-else-if="is_active(display)">Youth's class in {{display}}:</span>
                        <span v-else><i>Youth was not active.</i></span>
                    </td>
                    <td>
                        <b-dropdown right id="dropdown-text" class="m-2"
                            :variant="dropdown_variant"
                            :text="get_class_str(display)"
                            style="min-width: 100%;"
                            :disabled="display.length == 0"
                        >
                            <b-dropdown-text style="width: 240px;">
                                <i>Change the status and class for {{youth_name}} in {{display}}.</i>
                            </b-dropdown-text>
                            <b-dropdown-divider></b-dropdown-divider>
                            <b-dropdown-group id="add-class" header="Set Class" style="width: 240px;">
                                <b-dropdown-item-button v-for="c in class_list" @click="set_class(display, c)" :key="c">{{c}}</b-dropdown-item-button>
                            </b-dropdown-group>
                            <b-dropdown-divider></b-dropdown-divider>
                            <b-dropdown-group id="rem-class" header="Remove Class" style="width: 240px;">
                                <b-dropdown-item-button @click="set_class(display, 'Unknown')">Unknown</b-dropdown-item-button>
                                <b-dropdown-item-button @click="set_class(display, null)">-none-</b-dropdown-item-button>
                            </b-dropdown-group>
                        </b-dropdown>
                    </td>
                </tr>
            </table>
        </div>

        <table class="table table-bordered">
            <thead>
            <tr>
                <th scope="col" class="main_header">Year</th>
                <th scope="col" class="main_header" v-for="s in seasons" :key="s" :class="get_header_classes(s)">{{s}}</th>
            </tr>
            </thead>
            <tbody @mouseleave="dehover_cell">
            <tr v-if="years.length == 0">
                <td :colspan="seasons.length + 1" style="font-style: italic;">
                    This youth does not appear to have been registered for any classes.
                </td>
            </tr>
            <tr v-for="year in years" :key="year">
                <th scope="row" :class="get_header_classes(year)" @mouseover="dehover_cell()">20{{year}}</th>
                <td v-for="s in seasons"
                    :key="s"
                    @mouseover="hover_cell(s, year)"
                    @click="select_cell(s, year)"
                    style="text-align: left; position:relative;"
                    :class="get_cell_classes(s, year)"
                >
                    <span v-if="is_future_period(s, year)"></span>
                    <span v-else-if="is_active(s, year)">
                        &#9745; {{get_class_str(s,year)}}
                        <b-badge
                            v-if="!class_list.includes(get_class_str(s, year))"
                            pill variant="info"
                            v-b-tooltip.hover.html="warning_msg"
                            @click="show_warning_popup(get_class_str(s, year))"
                            style="position:absolute; right:.5em; top:1.25em;"
                        >?</b-badge>
                    </span>
                    <span v-else>&#9744;</span>
                </td>
            </tr>
            </tbody>
        </table>

        <div style="clear:both"></div>

        <b-modal v-model="warning_modal_visible" hide-footer lazy>
            <template slot="modal-title"><span style="color: black;">Removed Classes</span></template>
            <p>It appears the class <code> {{warning_modal_class}} </code> does not exist, most likely because it has been deleted.</p>
            <p><i>When a class is deleted, individual youth records of having attended that class are kept; however, no new youth can be added to that class in any period. This maintains backwards compatibility with previous records, and avoids having to delete the information when a class is deleted.</i></p>
            <p><b>Please note</b> that if you change this youth's class for this period, you will NOT be able to set it back to its original value without re-adding <code> {{warning_modal_class}} </code> as a class.</p>
            <p><i>If you believe this is in error, please check the list of classes.</i></p>
        </b-modal>
    </div>
</template>

<script>
import {Period} from '@/scripts/Period.js';

export default {
    name: 'period-classes-display',
    props: ['youth', 'active_periods', 'seasons', 'cur_period', 'reg_period', "class_list", "detail_view", 'disable_selection'],

    data: function () {
        return {
            hover: "",
            selected: "",

            // Tooltip text for warning message if old class
            warning_msg: "This class does not exist - click for more info.",

            warning_modal_visible: false,
            warning_modal_class: "",
        }
    },

    computed: {
        period_list: function() {
            return (this.active_periods == null) ? [] : Object.keys(this.active_periods);
        },

        years: function() {
            if (this.period_list.length == 0) return [];

            var min_year = this.period_list.map(Period.year).reduce((acc, curr) =>
                Math.min(acc, curr)
            );
            var max_year = Period.year(this.reg_period);
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

        dropdown_variant: function() {
            return (this.display.length > 0) ? 'primary' : 'outline-secondary';
        },
    },

    created() {
        Period.setSeasons(this.seasons);
    },

    mounted () {

    },

    watch: {
        seasons: function() {
            Period.setSeasons(this.seasons);
        },
    },

    methods: {
        is_active: function(season, year) {
            var period = Period.makePeriod(season, year);
            return this.period_list.includes(period.toString());
        },

        is_future_period: function(season, year) {
            return Period.newer(Period.makePeriod(season, year), this.reg_period);
        },

        get_class: function(season, year) {
            if (season.length == 0) {
                return "- n/a -  ";
            }
            var period = Period.makePeriod(season, year);
            return this.active_periods[period.toString()];
        },

        get_class_str: function(season, year) {
            var temp = this.get_class(season, year);
            return (temp != null) ? temp : "Not Active";
        },

        set_class: function(period, new_class) {
            let period_obj = Period.makePeriod(period);
            let old_class = this.get_class(period_obj.getSeason(), period_obj.getYear());
            this.$emit("change_period", {youth: this.youth, period, new_class, old_class});
        },

        hover_cell: function(season, year) {
            if (this.is_future_period(season, year)) {
                this.dehover_cell();
            }
            else {
                this.hover = Period.concat(season, year);
            }
        },

        dehover_cell: function() {
            this.hover = "";
        },

        select_cell: function(season, year) {
            if (this.is_future_period(season, year)) return;
            if (this.disable_selection != undefined) return;

            var temp = Period.concat(season, year);
            this.selected = (this.selected == temp) ? "" : temp;
        },

        get_cell_classes: function(season, year) {
            if (this.is_future_period(season, year)) {
                return "table-unavailable";
            }

            var sel = Period.compare(this.selected, new Period(season, year)) == 0;
            var hov = Period.compare(this.hover,    new Period(season, year)) == 0;

            if (sel) {
                return hov ? "table-hov-sel" : "table-sel" ;
            }
            else {
                return hov ? "table-hov" : "" ;
            }
        },

        get_header_classes: function(val) {
            var hov = Period.fromString(this.hover);
            var match_hov = (val == hov.year || val == hov.season);
            var match_sel = false;

            if (this.selected.length > 0) {
                let sel = Period.fromString(this.selected);
                match_sel = (val == sel.year || val == sel.season);
            }

            if (match_sel) {
                return match_hov ? "table-hov-sel" : "table-sel" ;
            }
            else {
                return match_hov ? "table-hov" : "" ;
            }
        },

        show_warning_popup: function(w_class) {
            this.warning_modal_class = w_class;
            this.warning_modal_visible = true;
        },
    },
}
</script>

<style scoped>
    table.table th.table-hov, table.table td.table-hov {
      background-color: #DFDFDF;
      /*background-color: #BBB;*/
      cursor: pointer;
    }

    table.table th.table-sel, table.table td.table-sel {
      background-color: #CBE0FE;
      /*background-color: #9ABCEA;*/
      cursor: pointer;
    }

    table.table th.table-hov-sel, table.table td.table-hov-sel {
      background-color: #B2C4DE;
      /*background-color: #769BCC;*/
      cursor: pointer;
    }

    table.table td.table-unavailable {
        background-color: #c0c0c0;
        cursor: default;
    }

    table.table thead tr th.main_header {
        width: 1%;
    }

</style>