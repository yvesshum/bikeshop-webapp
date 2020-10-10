<!-- Search bar to search a collection for all docs matching certain criteria -->

<!-- Usage:
    
    <YouthSearch
        :target_collection="GlobalYouthProfile"
        :search_fields="['First Name', 'Last Name', 'ID']"
        @SearchResults="function_to_handle_results"
        @SearchError="function_to_handle_error"
    ></YouthSearch>

    Props:
        target_collection: The name of the Firebase collection to search for docs in.
        search_fields: The fields within those docs to check the search term against.

    Default Values:
        If no value is given for target_collection, it will default to GlobalYouthProfile.
        If no value is given for search_fields, it will default to First Name, Last Name, and ID.

    The following will use all defaults:
        <YouthSearch></YouthSearch>

    Include "ID" in the search_fields to search for the actual document ID, not a field called "ID"

    Emits:
        SearchResults: An array of all documents matching the search term exactly.
        SearchError: An error returned by Firebase when retrieving the data.

    Note that terms must *exactly* match - Firestore does not support partial matches in queries.
-->

<template>
    <div class="youth_search">
        <input ref="input" type="text">
        <input ref="submit" type="submit" v-on:click="this.search">
    </div>
</template>

<script>
// @ is an alias to /src
import {db} from '@/firebase';
import {firebase} from '@/firebase';

export default {
  name: 'YouthSearch',
  props: ["target_collection", "search_fields"],
  components: {},

  mounted: function() {
      // Set fields and collection to passed values if they exist, defaults if not
      this.fields     = set_with_default(this.search_fields,     this.default_fields);
      this.collection = set_with_default(this.target_collection, this.default_collection);

      // Helper function for setting with default
      function set_with_default(value, default_value) {
          return (value != null) ? value : default_value;
      }
  },

  data: function() {
      return {
          // The most recently used search term
          search_term: null,

          // An object storing all the queries for each field
          // Key is the matching field, value is the resulting query
          query_results: null,

          // An object containing all the documents in the queries from query_results
          // Key is the doc's id, value is doc.data()
          result_docs: null,

          // Variables to store props if passed, or default values if not
          fields: null,
          collection: null,

          // Default variables - change at your own risk!
          default_fields: ["First Name", "Last Name", "ID"],
          default_collection: "GlobalYouthProfile",
      }
  },

  methods: {
      // Where all the magic happens - Search Firebase for the given term
      search: function(event) {

          // Prevent page from reloading on form submission
          event.preventDefault();

          // Initialize vars
          this.search_term = this.$refs.input.value;
          this.query_results = new Object();
          let result_docs = new Object();

          // Loop through each field to be searched
          this.fields.forEach(function(field) {

              // Make and store the query, using "ID" as a keyword for the document's actual ID
              if (field == "ID") field = firebase.firestore.FieldPath.documentId();
              this.query_results[field] = db.collection(this.collection).where(field, '==', this.search_term);

              // Retrieve the query from the database
              this.query_results[field].get().then(snapshot => {

                  // If the query came back empty, move on
                  if (snapshot.empty) return;

                  // If the query has results, add each matching doc to the array
                  snapshot.forEach(doc => {result_docs[doc.id] = doc.data();});
              })

              // Function to be run if Firebase returns an error
              .catch(err => {
                  // If there was an error, print it to the console and emit it
                  console.log("Error getting documents matching " + result_docs + ": ", err); // eslint-disable-line no-console
                  this.$emit("SearchError", err);
              });

          // Preserve the scope of the keyword 'this'
          }.bind(this));

          // Save and emit the resulting array
          this.result_docs = result_docs;
          this.$emit("SearchResults", this.result_docs);
      },
  },
}
</script>