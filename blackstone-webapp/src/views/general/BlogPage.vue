<template>
    <div>
        <div v-if="ready">
            <h1>Blog Page</h1>
            <p>general info</p>
            <p>{{this.blog.name}}</p>
            <p>{{this.blog.description}}</p>
            <p>{{this.blog.created}}</p>
            <br />
            <p>Posts are stored in this.blogPosts</p>
            <p v-for="post in blogPosts" :key="post.id">{{JSON.stringify(post)}}</p>

            <b-button @click="fetchMoreBlogs">load more blogs</b-button>
        </div>
        <div v-else>
            <b-spinner />
        </div>
    </div>
</template>
<script>
import { db } from "../../firebase";
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