<template>
    <div>
        <div v-if="ready">
            <top-bar />
            <h1 class="title">{{ this.blog.name }}</h1>
            <PageHeader
                :pageCategory="isStaff ? 'Staff Headers' : 'Youth Headers'"
                pageName="Blog Page"
            ></PageHeader>
            <p>{{this.blog.description}}</p>
            <!-- Blog post cards -->
            <div style="padding: 0 1rem">
                <BlogPostCard v-for="post in blogPosts" :key="post.id" :Post="post" />
            </div>

            <b-button @click="fetchMoreBlogs">load more blogs</b-button>

            <NewBlogPost :submitCallback="handleNewBlogPage" />

            <Footer />
        </div>
        <div v-else>
            <b-spinner />
        </div>

        <!-- Modals -->

        <!-- Msg -->
        <b-modal v-model="modal.msg.visible" hide-footer lazy>
            <template slot="modal-title">{{modal.msg.title}}</template>
            <div class="d-block text-center">
                <h3>{{modal.msg.text}}</h3>
            </div>
            <b-button class="mt-3" block @click="closeMsgModal" variant="primary">ok!</b-button>
        </b-modal>
    </div>
</template>

<script>
import { db } from "../../firebase";
import PageHeader from "@/components/PageHeader.vue";
import BlogPostCard from "@/components/BlogPostCard.vue";
import NewBlogPost from "@/components/NewBlogPost.vue";
import { isStaff } from "@/scripts/getPrivilege.js";

const limit = 1;
export default {
    name: "BlogPage",
    data() {
        return {
            ready: false,
            isStaff: false,
            blog: {
                name: "",
                description: "",
                created: "",
                id: "",
            },
            blogPosts: [],
            lastSeenDocSnapshot: null,
            modal: {
                msg: {
                    title: "",
                    text: "",
                    visible: false,
                },
            },
        };
    },

    components: {
        PageHeader,
        BlogPostCard,
        NewBlogPost,
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
            if (!postQuery.empty) {
                this.lastSeenDocSnapshot =
                    postQuery.docs[postQuery.docs.length - 1];
            } else {
                this.modal.msg.title = "";
                this.modal.msg.text = "No posts found!";
                this.modal.msg.visible = true;
            }

            return postQuery.docs.map((doc) => {
                return {
                    id: doc.id,
                    ...doc.data(),
                    parentBlogID: this.blog.id,
                };
            });
        },

        async fetchMoreBlogs() {
            console.log("fetch", this.lastSeenDocSnapshot);
            let posts = await this.getBlogPosts(this.lastSeenDocSnapshot);
            this.blogPosts = this.blogPosts.concat(posts);
        },

        closeMsgModal() {
            this.modal.msg.visible = false;
        },

        async handleNewBlogPage() {},
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

            this.isStaff = await isStaff();
            this.isStaff = false;
        } catch (err) {
        } finally {
            this.ready = true;
        }
    },
};
</script>

<style scoped>
.postHeader {
    width: 100%;
}
</style>
