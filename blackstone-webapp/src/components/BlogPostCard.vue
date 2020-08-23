<template>
	<b-card class="post_card">
		<span class="delete_button" @click="handlePostDelete(Post.id)">Delete</span>
		<div class="container" @click="viewBlogPost(Post.id)">
			<b-row style="margin: 1.25rem 0; width: 100%;">
				<b-col class="blog_post_image" cols="3"></b-col>
				<b-col style="margin-left: 1rem; text-align: left;" cols="9">
					<b-card-title style="padding-right: 1.5rem">Welcome To Blackstone Bikes!</b-card-title>
					<b-card-sub-title style="margin-bottom: 8px;">
						<i>By Yves</i>
					</b-card-sub-title>
					<b-card-sub-title>Posted Aug 15, 2020</b-card-sub-title>
				</b-col>
			</b-row>
		</div>
	</b-card>
</template>

<script>
export default {
  name: "BlogPostCard",
  
	props: {
		Post: Object,
  },
  
	methods: {
		handlePostDelete(post_id) {
			console.log("Deleting post: ", post_id);
		},

		viewBlogPost(post_id) {
			console.log("Opening blog post: ", post_id);
		},
	},
};
</script>

<style scoped>
.container {
	margin: 0;
	cursor: pointer;
}

.container:hover {
	background-color: #f7f7f7;
}

.card-body {
	padding: 0;
}

.content {
	text-align: center;
}

.post_card {
	max-width: 600px;
	margin: 1.5rem auto;
	float: none;
}

.card-subtitle {
	font-size: 14px;
}

.delete_button {
	cursor: pointer;
	color: grey;
	font-size: 12px;
	position: absolute;
	top: 1.25rem;
	right: 1rem;
	z-index: 10;
}

.delete_button:hover {
	text-decoration: underline;
}

.blog_post_image {
	margin: -1.25rem 0 -1.25rem -1rem;
	padding: 0;
	background-image: url("https://picsum.photos/400/400/?image=20");
	background-size: cover;
}
</style>