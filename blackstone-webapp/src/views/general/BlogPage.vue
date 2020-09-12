<template>
    <div>
      <div v-if="ready">
        <div class="content">
            <top-bar />
            <h1 class="title">{{ this.blog.name }}</h1>
            <PageHeader
                :pageCategory="isStaff ? 'Staff Headers' : 'Youth Headers'"
                pageName="Blog Page"
            ></PageHeader>
            <p>{{ this.blog.description }}</p>
            <!-- Blog post cards -->
            <div style="padding: 0 1rem">
                <BlogPostCard v-for="post in blogPosts" :key="post.id" :Post="post" :deleteCallback="postDeleteCallback"/>
            </div>

            <b-button style="margin-top: 1rem" @click="fetchMoreBlogs">load more blogs</b-button>

            <NewBlogPost
                :show="showPostForm"
                @close="showPostForm = false"
                :submitCallback="handleNewBlogPost"
            />

            <!-- New Post Button -->
            <b-button
                id="newPostButton"
                variant="success"
                @click="showPostForm = true"
            >
                <font-awesome-icon icon="plus" class="icon alt" />
            </b-button>
            
            </div>
            <Footer />
        </div>
        <div v-else>
            <b-spinner />
        </div>

        <!-- Modals -->

        <!-- Msg -->
        <b-modal v-model="modal.msg.visible" hide-footer lazy>
            <template slot="modal-title">{{ modal.msg.title }}</template>
            <div class="d-block text-center">
                <h3>{{ modal.msg.text }}</h3>
            </div>
            <b-button class="mt-3" block @click="closeMsgModal" variant="primary"
                >ok!</b-button
            >
        </b-modal>

        <!-- Loading -->
        <b-modal
            v-model="modal.loading.visible"
            hide-footer
            lazy
            hide-header-close
            no-close-on-esc
            no-close-on-backdrop
        >
            <div class="d-block text-center">
                <div slot="table-busy" class="text-center text-danger my-2">
                    <b-spinner class="align-middle"></b-spinner>
                    <strong>Loading...</strong>
                </div>
            </div>
        </b-modal>
    </div>
</template>

<script>
import { db, Timestamp } from "../../firebase";
import PageHeader from "@/components/PageHeader.vue";
import BlogPostCard from "@/components/BlogPostCard.vue";
import NewBlogPost from "@/components/NewBlogPost.vue";
import { isStaff } from "@/scripts/getPrivilege.js";

const limit = 10;
export default {
    name: "BlogPage",
    data() {
        return {
            showPostForm: false,
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
                loading: {
                    visible: false
                }
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
                this.lastSeenDocSnapshot = postQuery.docs[postQuery.docs.length - 1];
            } else {
                this.modal.msg.title = "";
                this.modal.msg.text = "All posts are retreived";
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

        async handleNewBlogPost(postObj) {
            this.showPostForm = false;
            this.modal.loading.visible = true;

            try {
                await db
                    .collection("GlobalBlogs")
                    .doc(this.blog.id)
                    .collection("Posts")
                    .add({
                        ...postObj,
                        time: Timestamp.fromDate(new Date()),
                    });
            }
            catch (error) {
                window.alert(error)    
                return null;
            }

            this.blogPosts = await this.getBlogPosts(null)

            this.modal.loading.visible = false;
            this.modal.msg.text = "Successfully added a new post "
            this.modal.msg.title = "Success"
            this.modal.msg.visible = true
        },

        async postDeleteCallback(postObj) {
            this.blogPosts = await this.getBlogPosts(null)
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

            this.isStaff = await isStaff();
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

#newPostButton {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    width: 60px;
    height: 60px;
    border-radius: 30px;
}
</style>
