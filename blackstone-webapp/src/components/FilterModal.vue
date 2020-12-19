<template>
  <div class="filter_modal">

    <b-modal v-model="is_showing" size="lg"
      header-bg-variant="dark" header-text-variant="light"
      footer-bg-variant="dark"
    >

      <template slot="modal-title">
        <h4>{{title == "" ? "Set Filters" : "Filter By " + title}}</h4>
      </template>

      <div style="padding:10px;">

        <!-- Create a card for each filter group -->
        <b-card v-for="(group, i) in filter_list" :key="'group-'+i" style="margin-bottom: 10px;" no-body>

          <!-- The header for the group -->
          <template #header>
            <div style="float:left">
              <h6 class="mb-0" style="display:inline-block; margin-right: 25px;">Group {{i+1}}</h6>
              <span @click="group.show = !group.show" style="cursor: pointer; font-size: small;">
                {{group.show ? "Hide" : "Show"}}
              </span>
            </div>
            <div style="float:right;" v-if="filter_list.length > 1">
              <b-button size="sm" variant="outline-danger" style="font-size: xx-small;" @click="delete_group(i)">×</b-button>
            </div>
            <div style="clear:both;"></div>
          </template>

          <!-- The group body: list of filters, followed by new filter button -->
          <b-collapse v-model="group.show" style="padding: 10px 25px;">

            <!-- Each filter -->
            <div v-for="(filter, j) in group.filters" :key="'filter-'+i+'-'+j">
              <b-button size="sm" variant="outline-danger" @click="delete_filter(i,j)" style="display:inline-block; margin-right: 10px;">×</b-button>
              <b-form-checkbox switch class="mr-n2" v-model="filter.checked" style="display:inline-block;"/>
              <select style="margin-left: 10px;" v-model="filter.option">
                <option v-for="option in options" :key="option" :value='option'>{{option}}</option>
              </select>
              <select style="margin-right: 10px;" v-model="filter.op_index">
                <option v-for="(op, op_index) in operations" :key="'op-'+op_index" :value='op_index'>{{op.name}}</option>
              </select>

              <div v-if="operations[filter.op_index].num_inputs == 2" style="display:inline;">
                <b-form-input style="display:inline; max-width: 130px;" v-model="filter.value"></b-form-input>
                &
                <b-form-input style="display:inline; max-width: 130px;" v-model="filter.value2"></b-form-input>
              </div>
              <div v-else-if="operations[filter.op_index].num_inputs != 0" style="display:inline;">
                <b-form-input style="display:inline; max-width: 282px;" v-model="filter.value"></b-form-input>
              </div>

              <b-form-checkbox v-if="operations[filter.op_index].inclusive"
                v-model="filter.inclusive"
                style="display:inline-block; margin-left: 15px;"
              >
                Inclusive?
              </b-form-checkbox>
            </div>

            <!-- New Filter Button -->
            <b-button block variant="outline-primary" @click="add_filter(i)" style="border-style: dashed; margin-top: 5px;">New Filter</b-button>
          </b-collapse>
        </b-card>

        <b-button block variant="outline-primary" @click="add_group" style="border-style: dashed;">New Group</b-button>
      </div>

      <template slot="modal-footer" style="margin:auto;">
          <b-button variant="info"  @click="show_info_modal" class="mr-auto">?</b-button>
          <b-button variant="success" @click="apply_filters" >Apply Filters</b-button>
          <b-button variant="danger"  @click="stop_filtering">Stop Filtering</b-button>
      </template>
    </b-modal>

    <b-modal v-model="info_modal_visible" hide-footer lazy header-bg-variant="info" header-text-variant="light">
      <template slot="modal-title">
        <h4>Searching With Filters</h4>
      </template>

      <h5>Adding and Removing Filters</h5>

      <p>Use the <code>New Group</code> button to create a new filter group, and use the <code>New Filter</code> button to create a new filter within a given group.</p>

      <p>Use a filter's switch button to disable it, or the <code>x</code> button to remove it entirely.</p>

      <h5>Filtering Data</h5>

      <p>Use the <code>Apply Filters</code> button to start filtering the data, and use the <code>Stop Filtering</code> button to stop filtering the data.</p>

      <p>Entries in the table will match the search if they pass <i>all of the filters</i> within <i>any individual group</i>.</p>

      <p>The following interactive test search demonstrates the way entries will match search groups:</p>

      <b-card>
        <template #header><h6>Test Search</h6></template>
        <b-card style="margin-bottom: 10px;">
          <template #header>
            <h6 class="mb-0" style="display:inline-block; margin-right: 25px;">Group 1</h6>
          </template>
          <b-form-checkbox switch class="mr-n2" v-model="info_modal_filters.A" style="display:inline-block;"/> Filter A
          <br />
          <b-form-checkbox switch class="mr-n2" v-model="info_modal_filters.B" style="display:inline-block;"/> Filter B
        </b-card>
        <b-card style="margin-bottom: 10px;">
          <template #header>
            <h6 class="mb-0" style="display:inline-block; margin-right: 25px;">Group 2</h6>
          </template>
          <b-form-checkbox switch class="mr-n2" v-model="info_modal_filters.C" style="display:inline-block;"/> Filter C
          <br />
          <b-form-checkbox switch class="mr-n2" v-model="info_modal_filters.D" style="display:inline-block;"/> Filter D
        </b-card>

        <template #footer>This search will match
          <span v-if="info_modal_filter_pass.length == 0"><b>all entries</b>.</span>
          <span v-else>
            {{(info_modal_filter_pass.length == 1 && info_modal_filter_pass[0].length < 9) ? "just the" : "all"}} entries that pass <b>{{info_modal_filter_pass[0]}}</b><span v-if="info_modal_filter_pass.length > 1">, as well as all entries that pass <b>{{info_modal_filter_pass[1]}}</b></span>.
          </span>
        </template>
      </b-card>
      
    </b-modal>
  </div>
</template>

<script>

export default {
  name: 'filter_modal',

  components: {},

  props: {
    options: {
      type: Array,
      default: () => [],
    },

    operations: {
      type: Array,
      default: () => [],
    },

    title: {
      type: String,
      default: "",
    },
  },

  data: function() {
    return {

      // Whether the filter modal should be displayed
      is_showing: false,

      // Whether the info modal should be displayed
      info_modal_visible: false,

      // The list of groups of filters
      filter_list: [{ filters: [this.make_new_filter()], show: true }],

      info_modal_filters: {
        A: true,
        B: true,
        C: false,
        D: true,
      },
    };
  },

  created: function() {

    // Expose a subset of the functions to the outside
    this.$emit("created", {
      show: this.show,
      hide: this.hide,
      is_showing: () => this.is_showing,
    });
  },

  methods: {

    show: function() {
      this.is_showing = true;
    },

    hide: function() {
      this.is_showing = false;
    },

    make_new_filter: function() {
      return {
        checked:  true,
        option:   this.options[0],
        op_index: 0,
        value:    undefined,
      };
    },

    add_filter: function(group_index) {
      this.filter_list[group_index].filters.push(this.make_new_filter());
    },

    add_group: function() {
      this.filter_list.push({ filters: [this.make_new_filter()], show: true });
    },

    delete_filter: function(group_index, filter_index) {
      this.$delete(this.filter_list[group_index].filters, filter_index);
    },

    delete_group: function(group_index) {
      this.$delete(this.filter_list, group_index);
    },


    // Show the help modal explaining how to use filters
    show_info_modal: function() {
      this.info_modal_visible = true;
    },

    // Apply the current list of filters to the data
    apply_filters: function() {
      this.$emit("filters", this.filter_list.map(group => group.filters.filter(f => f.checked)));
      this.hide();
    },

    // Stop filtering the data
    stop_filtering: function() {
      this.$emit("filters", null);
      this.hide();
    },

  },

  computed: {
    info_modal_filter_pass: function() {
      var group_1 = [], group_2 = [], groups = [];

      // Get a list of applied filters in the first group
      for (var filter of ["A", "B"]) {
        if (this.info_modal_filters[filter]) {
          group_1.push("Filter " + filter);
        }
      }

      // Get a list of applied filters in the second group
      for (var filter of ["C", "D"]) {
        if (this.info_modal_filters[filter]) {
          group_2.push("Filter " + filter);
        }
      }

      // Only push non-empty groups
      if (group_1.length > 0) groups.push(group_1.join(" and "));
      if (group_2.length > 0) groups.push(group_2.join(" and "));

      return groups;
    },
  },

}

</script>

<style scoped></style>
