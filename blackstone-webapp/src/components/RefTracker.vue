<template>
  <div class="ref-tracker">

    <b-toast id="warning-msg" variant="warning" solid no-auto-hide no-close-button toaster="b-toaster-bottom-right">

      <template v-slot:toast-title>
        <div class="d-flex flex-grow-1 align-items-baseline">
          <strong class="mr-auto">Warning - Updated Data</strong>
        </div>
      </template>

      <p>Changes have been made to the database since the last time this page was loaded.
      Please refresh the page or click here to see them.</p>

      <b-button-toolbar justify>
        <b-button size="sm" variant="danger"  @click="ignore_update">Ignore</b-button>
        <b-button size="sm" variant="success" @click="accept_update">Load Changes</b-button>
      </b-button-toolbar>
    </b-toast>

  </div>
</template>

<script>
// @ is an alias to /src
import {db} from '../firebase';
import {firebase} from '../firebase';

export default {
  name: 'ref-tracker',
  props: ["reference"],
  components: {},

  data: function() {
    return {
      document: null,
      observer: null,

      local_snapshot: null,
      updated_snapshot: null,

      loaded: false,
    };
  },

  mounted: async function() {
    this.initialize_ref();
    this.$emit("load_complete", {
      reset: this.reset,
      save_changes: this.save_changes,
    });
  },

  watch: {
    reference: function() {
      this.initialize_ref();
    },
  },

  methods: {

    initialize_ref: function() {

      // Clear any pre-existing data
      this.reset();

      // Attach a new listener to the reference
      if (this.reference != undefined) {
        this.observer = this.reference.onSnapshot(this.handle_snapshot, this.handle_error);
      }
    },

    // Handle an incoming snapshot by saving it if it's the first one and alerting the user if it's not
    handle_snapshot: function(snapshot) {

      // Pending writes means the user is making the update
      if (snapshot.metadata.hasPendingWrites) {
        this.local_snapshot = snapshot;
        this.loaded = true;
        this.$emit("snapshot", {snapshot, update: true});
      }

      // If nothing's been loaded yet, just save the snapshot
      else if (!this.loaded) {
        this.local_snapshot = snapshot;
        this.loaded = true;
        this.$emit("snapshot", {snapshot, update: false});
      }

      // If a snapshot has already been loaded, alert the user
      else {
        this.updated_snapshot = snapshot;
        this.$bvToast.show('warning-msg');
      }
    },

    // Handle an error by printing it to the console
    handle_error: function(err) {
      console.error("Error retrieving snapshot:", err);
    },

    // User wants to load the changed snapshot
    accept_update: function() {
      this.local_snapshot = this.updated_snapshot;
      this.updated_snapshot = null;
      this.$emit("snapshot", {snapshot: this.local_snapshot, update: true});
      this.$bvToast.hide('warning-msg');
    },

    // User wants to ignore the changed snapshot
    ignore_update: function() {
      this.$bvToast.hide('warning-msg');
    },

    // Clear this ref tracker
    reset: function() {

      // Detatch and clear the previous listener, if applicable
      if (this.observer != null) {
        this.observer();
        this.observer = null;
      }

      // Clear any local data
      this.local_snapshot = null;
      this.updated_snapshot = null;
      this.loaded = false;
    },

    save_changes: function(changes) {
      this.reference.update(changes.changes).then(changes.success, changes.error);
    },
  }
}
</script>