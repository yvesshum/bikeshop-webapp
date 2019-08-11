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
  	// this.search();
  },

  data: function() {
  	return {
  		search_term: null,
  		query_results: null,
  		result_docs: null
  	}
  },

  methods: {
  	search: function(event) {
  		event.preventDefault();

  		let result_docs = new Object();

  		this.search_term = this.$refs.input.value;

  		this.query_results = new Object();
  		this.query_results["fn"] = query_for("First Name", this.search_term);
  		this.query_results["ln"] = query_for("Last Name", this.search_term);
  		this.query_results["id"] = query_for(firebase.firestore.FieldPath.documentId(), this.search_term);

  		Object.keys(this.query_results).forEach(function(result) {
  			this.query_results[result].get().then(snapshot => {
  				if (snapshot.empty) return;
	  			snapshot.forEach(doc => {
	  				result_docs[doc.id] = doc.data();
	  			});
	  		})
	  		.catch(err => {
	  			console.log("Error getting documents matching " + result + ": ", err);
	  		});
  		}.bind(this));

  		this.result_docs = result_docs;
  		console.log(this.result_docs);
  		this.$emit("SearchResults", this.result_docs);

  		function query_for(field, term) {
  			return db.collection("GlobalYouthProfile").where(field, '==', term);
  		};
  	},
  },
}
</script>