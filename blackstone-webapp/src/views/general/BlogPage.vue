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
              <BlogPostCard v-for="post in blogPosts" :key="post.id" :Post="post"/>
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
import BlogPostCard from "@/components/BlogPostCard.vue";

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
      BlogPostCard,
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
</style>