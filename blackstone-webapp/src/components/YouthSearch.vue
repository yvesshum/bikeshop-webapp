<!-- Search bar to search a collection for all docs matching certain criteria -->
<!-- Usage:
	
	<YouthSearch :target_collection="GlobalYouthProfile" :search_fields="['First Name', ...]">
	If no value is given for target_collection, it will default to GlobalYouthProfile.
	If no value is given for search_fields, it will default to First Name, Last Name, and ID

	Include "ID" in the search_fields to search for the actual document ID, not a field called "ID"

	The following will use all defaults:
	<YouthSearch></YouthSearch>

	Emits an array of all documents matching the search term exactly.

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
import {rb} from '@/firebase';
import firebase_app from 'firebase/app';
import firebase_auth from 'firebase/auth';

export default {
  name: 'YouthSearch',
  props: ["target_collection", "search_fields"],
  components: {
    
  },

  mounted: function() {
  	this.fields     = set_with_default(this.search_fields,     this.default_fields);
  	this.collection = set_with_default(this.target_collection, this.default_collection);

  	function set_with_default(value, default_value) {
  		return (value != null) ? value : default_value;
  	};
  },

  data: function() {
  	return {
  		search_term: null,
  		query_results: null,
  		result_docs: null,
  		fields: null,
  		collection: null,

  		// Default variables - change at your own risk!
  		default_fields: ["First Name", "Last Name", "ID"],
  		default_collection: "GlobalYouthProfile",
  	}
  },

  methods: {
  	search: function(event) {

  		// Prevent page from reloading on form submission
  		event.preventDefault();

  		// Initialize vars
  		this.search_term = this.$refs.input.value;
  		this.query_results = new Object();
  		let result_docs = new Object();

  		this.fields.forEach(function(field) {

  			console.log("Searching for " + this.search_term + " in field " + field + ".");

  			// Make and store the query, using "ID" as a keyword for the document's actual ID
  			if (field == "ID") field = firebase.firestore.FieldPath.documentId();
  			this.query_results[field] = db.collection(this.collection).where(field, '==', this.search_term);

  			// Retrieve the query from the database
  			this.query_results[field].get().then(snapshot => {

  				// If the query came back empty, move on
  				if (snapshot.empty) return;

  				// If the query has results, add each matching doc to the array
	  			snapshot.forEach(doc => {
	  				console.log("Found doc ", doc.data());
	  				result_docs[doc.id] = doc.data();
	  			});
	  		})
	  		.catch(err => {
	  			// If there was an error, print it to the console and emit it
	  			console.log("Error getting documents matching " + result + ": ", err);
	  			this.$emit("SearchError", err);
	  		});
  		}.bind(this));

  		// Save and emit the resulting array
  		this.result_docs = result_docs;
  		console.log("Results: ", this.result_docs);
  		this.$emit("SearchResults", this.result_docs);
  	},
  },
}
</script>