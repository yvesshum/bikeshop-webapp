<template>
  <div class="filter_dropdown">

    <b-modal v-model="is_showing" size="lg"
      header-bg-variant="dark" header-text-variant="light"
      footer-bg-variant="dark"
    >

    <template slot="modal-title">
      <h4>{{title == "" ? "Set Filters" : "Filter By " + title}}</h4>
    </template>

    <div style="padding:10px;">

      <!-- Create a card for each filter group -->
      <b-card v-for="(group, i) in filter_list_display" :key="'group-'+i" style="margin-bottom: 10px;" no-body>

        <!-- The header for the group -->
        <template #header>
          <div style="float:left">
            <h6 class="mb-0" style="display:inline-block; margin-right: 25px;">Group {{i+1}}</h6>
            <span @click="group.show = !group.show" style="cursor: pointer; font-size: small;">
              {{group.show ? "Hide" : "Show"}}
            </span>
          </div>
          <div style="float:right;" v-if="filter_list_display.length > 1">
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
              <option v-for="option in options" :value='option'>{{option}}</option>
            </select>
            <select style="margin-right: 10px;" v-model="filter.op_index">
              <option v-for="(op, op_index) in operations" :value='op_index'>{{op.name}}</option>
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

    <b-modal v-model="info_modal_visible" hide-footer lazy size="lg">
      <template slot="modal-title">
        <span style="color: black;">Searching With Filters</span>
      </template>

      <p>Use the "New Group" button to create a new filter group, and use the "New Filter" button to create a new filter within the respective group.</p>

      <p>Use the "Apply Filters" button to start filtering the data, and use the "Stop Filtering" button to stop filtering the data.</p>

      <p>Use a filter's switch button to disable it, or the x button to remove it entirely.</p>

      <p>Entries in the table will match the search if they pass all filters within any group.  For example, the following search...</p>

      <b-card>
        <b-card style="margin-bottom: 10px;">
          <template #header>
            <h6 class="mb-0" style="display:inline-block; margin-right: 25px;">Group 1</h6>
          </template>
          Filter A
          <br />
          Filter B
        </b-card>
        <b-card style="margin-bottom: 10px;">
          <template #header>
            <h6 class="mb-0" style="display:inline-block; margin-right: 25px;">Group 2</h6>
          </template>
          Filter C
        </b-card>
      </b-card>

      <p>...will match all entries that pass both Filter A and Filter B, <em>and</em> all entries that pass Filter C.</p>
    </b-modal>
  </div>
</template>

<script>

export default {
  name: 'filter_dropdown',

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

      // Whether to dropdown should be displayed
      is_showing: false,

      // Whether the info modal should be displayed
      info_modal_visible: false,

      // The list of groups of filters
      filter_list: [{ filters: [this.make_new_filter()], show: true }],
    };
  },

  computed: {

    // For some reason, deleting filters & groups doesn't seem to work unless I do this
    filter_list_display: function() {
      return this.filter_list;
    },
  },

  created: function() {

    // Expose a subset of the functions to the outside
    this.$emit("dropdown_obj", {
      show: this.show,
      hide: this.hide,
      is_showing: () => this.is_showing,
    });
  },

  mounted: function() {

  },

  watch: {

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

}

</script>

<style scoped></style>
