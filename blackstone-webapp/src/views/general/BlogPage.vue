<template>
    <div>
        <div v-if="ready">
            <top-bar />
            <h1 class="title">{{this.blog.name}}</h1>
            <PageHeader pageCategory="Staff Headers" pageName="Blog Page"></PageHeader>
            <p>general info</p>
            <p>{{this.blog.name}}</p>
            <p>{{this.blog.description}}</p>
            <p>{{this.blog.created}}</p>
            <br />
            <p>Posts are stored in this.blogPosts</p>
            <p v-for="post in blogPosts" :key="post.id">{{JSON.stringify(post)}}</p>

            <!-- Blog post cards -->
            <div style="padding: 0 1rem">
              <b-card class="post_card" v-for="post in blogPosts" :key="post.id">
                <span class="delete_button" @click="handlePostDelete(post.id)">Delete</span>
                <div class="container" @click="viewBlogPost(post.id)">
                  <b-row style="margin: 1.25rem 0; width: 100%;">
                    <b-col class="blog_post_image" cols="3"></b-col>
                    <b-col style="margin-left: 1rem; text-align: left;" cols="9">
                      <b-card-title
                        style="padding-right: 1.5rem"
                      >Welcome To Blackstone Bikes!</b-card-title>
                      <b-card-sub-title style="margin-bottom: 8px;">
                        <i>By Yves</i>
                      </b-card-sub-title>
                      <b-card-sub-title>
                        Posted Aug 15, 2020
                      </b-card-sub-title>
                    </b-col>
                  </b-row>
                </div>
              </b-card>
            </div>

            <b-button @click="fetchMoreBlogs">load more blogs</b-button>

            <Footer />
        </div>
        <div v-else>
            <b-spinner />
        </div>
    </div>
</template>

<script>
import { db } from "../../firebase";
import PageHeader from "@/components/PageHeader.vue";

const limit = 1;
export default {
    name: "BlogPage",
    data() {
        return {
            ready: false,
            blog: {
                name: "",
                description: "",
                created: "",
                id: "",
            },
            blogPosts: [],
            lastSeenDocSnapshot: null,
        };
    },

    components: {
      PageHeader,
    },

    methods: {
        async getBlogPosts(lastSeenDocSnapshot) {
            let ref = db
                .collection("GlobalBlogs")
                .doc(this.blog.id)
                .collection("Posts")
                .orderBy("time", "desc")
                .limit(limit);
            let postQuery = null;
            if (lastSeenDocSnapshot == null) {
                postQuery = await ref.get();
            } else {
                postQuery = await ref.startAfter(lastSeenDocSnapshot).get();
            }
            this.lastSeenDocSnapshot =
                postQuery.docs[postQuery.docs.length - 1];

            return postQuery.docs.map((doc) => {
                return {
                    id: doc.id,
                    ...doc.data(),
                };
            });
        },

        async fetchMoreBlogs() {
            let posts = await this.getBlogPosts(this.lastSeenDocSnapshot);
            this.blogPosts = this.blogPosts.concat(posts);
        },

        handlePostDelete(post_id) {
          console.log("Deleting post: ", post_id);
        },

        viewBlogPost(post_id) {
          console.log("Opening blog post: ", post_id);
        }
    },

    async mounted() {
        this.blog.id = this.$route.query.id;
        try {
            let blogQuery = await db
                .collection("GlobalBlogs")
                .doc(this.blog.id)
                .get();
            let blogData = blogQuery.data();
            this.blog.name = blogData.name;
            this.blog.description = blogData.description;
            this.blog.created = blogData.created.toDate().toLocaleDateString();

            let posts = await this.getBlogPosts(this.lastSeenDocSnapshot);
            this.blogPosts = posts;
        } catch (err) {
        } finally {
            this.ready = true;
        }
    },
};
</script>

<style scoped>
.container {
	margin: 0;
  cursor: pointer;
}

.container:hover {
  background-color: #F7F7F7;
}

.card-body {
	padding: 0;
}

.content {
	text-align: center;
}

.post_card {
	max-width: 600px;
	margin: 1.5rem auto; /* Added */
	float: none; /* Added */
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