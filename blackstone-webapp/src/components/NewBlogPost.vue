<template>
	<b-container>
		<b-card class="mx-auto post_form">
			<b-card-title>Create a blog post!</b-card-title>
			<b-form @submit="onSubmit" @reset="onReset">
        <!-- Title -->
				<b-form-group
					id="input-group-1"
					label="Title:"
					label-for="input-1"
				>
					<b-form-input
						id="input-1"
						v-model="title"
						required
						placeholder="Your title here"
					></b-form-input>
				</b-form-group>

        <!-- Subtitle -->
        <b-form-group
					id="input-group-2"
					label="Subtitle:"
					label-for="input-2"
				>
					<b-form-input
						id="input-2"
						v-model="subtitle"
						required
						placeholder="Your subtitle here"
					></b-form-input>
				</b-form-group>

        <!-- Name -->
				<b-form-group id="input-group-3" label="Your Name:" label-for="input-3">
					<b-form-input id="input-3" v-model="name" required placeholder="Enter name"></b-form-input>
				</b-form-group>


        <b-form-group id="input-group-4" label="Post Content:" label-for="input-4">
					<vue-editor id="input-4" v-model="content"></vue-editor>
				</b-form-group>
        

        <b-button type="submit" variant="success">Submit</b-button>
        <b-button type="reset" variant="danger">Reset</b-button>
			</b-form>
		</b-card>
	</b-container>
</template>

<script>
import { VueEditor } from "vue2-editor";

export default {
  name: "NewBlogPost",
  data() {
      return {
        title: '',
        subtitle: '',
        name: '',
        content: '<h1>Some initial content</h1>',
      }
  },
  components: {
    VueEditor,
  },
	methods: {
		onSubmit(evt) {
			evt.preventDefault();
			alert(this.title);
		},
		onReset(evt) {
			evt.preventDefault();
			this.title = "";
      this.subtitle = "";
      this.name = "";
			this.content = "";
		},
	},
};
</script>

<style scoped>
.post_form {
  max-width: 800px; 
  text-align: left;
  padding: 1.5rem;
}
</style>