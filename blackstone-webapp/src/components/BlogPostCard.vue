<template>
    <div v-if="ready">
        <b-card class="post_card">
            <span
                class="delete_button"
                @click="handlePostDeleteClick(PostObj.id)"
                v-if="isStaff"
                >Delete</span
            >
            <div class="container" @click="viewBlogPost(PostObj.id)">
                <b-row style="margin: 1.25rem 0; width: 100%;">
                    <b-col class="blog_post_image" cols="3"></b-col>
                    <b-col style="margin-left: 1rem; text-align: left" cols="9">
                        <b-card-title style="padding-right: 1.5rem">
                            {{ PostObj.title }}
                        </b-card-title>
                        <b-card-sub-title style="margin-bottom: 8px">
                            <i>By {{ PostObj.posterName }}</i>
                        </b-card-sub-title>
                        <b-card-sub-title
                            >Posted on {{ posted }}</b-card-sub-title
                        >
                    </b-col>
                </b-row>
            </div>
        </b-card>

        <!-- Post modal -->
        <b-modal
            title="Title"
            v-model="showPostModal"
            size="xl"
            hide-footer
            hide-header
            no-fade
        >
            <BlogPostContent :post="PostObj" :closeHandler="closePostModal" />
            <b-button
                id="editButton"
                variant="info"
                @click="onEditClicked"
                v-show="isStaff"
            >
                <font-awesome-icon icon="pen" class="icon alt" />
            </b-button>
        </b-modal>

        <!-- Edit modal -->
        <NewBlogPost
            :edit="true"
            :title="PostObj.title"
            :subtitle="PostObj.subtitle"
            :name="PostObj.posterName"
            :content="PostObj.content"
            :show="showEditModal"
            @close="showEditModal = false"
            :submitCallback="handleBlogEdit"
        />

        <!-- Msg -->
        <b-modal v-model="modal.msg.visible" hide-footer lazy>
            <template slot="modal-title">{{ modal.msg.title }}</template>
            <div class="d-block text-center">
                <h3>{{ modal.msg.text }}</h3>
            </div>
            <b-button
                class="mt-3"
                block
                @click="closeMsgModal"
                variant="primary"
                >ok!</b-button
            >
        </b-modal>

        <!-- Confirmation -->
        <b-modal v-model="modal.conf.visible" hide-footer lazy>
            <template slot="modal-title">Are you sure?</template>
            <div class="d-block text-center">
                <h3>
                    Are you sure you want to delete post with the title:
                    {{ Post.title }}?
                </h3>
            </div>
            <b-button
                class="mt-3"
                block
                @click="closeConfModal"
                variant="success"
                >Cancel</b-button
            >
            <b-button
                class="mt-3"
                block
                @click="handlePostDelete"
                variant="danger"
                >Yes, Delete</b-button
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
import BlogPostContent from "@/components/BlogPostContent.vue";
import moment from "moment";
import { isStaff } from "@/scripts/getPrivilege.js";
import NewBlogPost from "@/components/NewBlogPost.vue";
import { db } from "@/firebase.js";
export default {
    name: "BlogPostCard",
    props: {
        Post: Object,
        deleteCallback: Function,
    },
    data() {
        return {
            showPostModal: false,
            showEditModal: false,
            isStaff: false,
            ready: false,
            modal: {
                msg: {
                    visible: false,
                    title: "",
                    text: "",
                },
                conf: {
                    visible: false,
                },
                loading: {
                    visible: false,
                },
            },
            PostObj: {},
        };
    },
    computed: {
        posted: function () {
            return moment(this.PostObj.time.toDate()).format(
                "ddd, MMM DD YYYY, hh:mm a"
            );
        },
    },
    methods: {
        handlePostDeleteClick(post_id) { // eslint-disable-line no-unused-vars
            this.modal.conf.visible = true;
        },
        async handlePostDelete() {
            this.modal.conf.visible = false;
            this.modal.loading.visible = true;
            try {
                await db
                    .collection("GlobalBlogs")
                    .doc(this.Post.parentBlogID)
                    .collection("Posts")
                    .doc(this.Post.id)
                    .delete();
            } catch (error) {
                window.alert(error);
                return null;
            }
            await this.deleteCallback();
            this.modal.loading.visible = false;
            this.modal.msg.text = "Successfully deleted post";
            this.modal.msg.visible = true;
        },
        viewBlogPost(post_id) { // eslint-disable-line no-unused-vars
            // console.log("Opening blog post: ", post_id);
            this.showPostModal = true;
        },
        closePostModal() {
            this.showPostModal = false;
        },
        onEditClicked() {
            // console.log("clicked");
            this.showEditModal = true;
        },
        async handleBlogEdit(blogObj) {
            this.showPostModal = false;
            this.showEditModal = false;
            this.modal.loading.visible = true;
            try {
                await db
                    .collection("GlobalBlogs")
                    .doc(this.PostObj.parentBlogID)
                    .collection("Posts")
                    .doc(this.PostObj.id)
                    .update(blogObj);
            } catch (error) {
                window.alert(`An error has occured. Error: ${error}`);
                return;
            }
            // console.log("old post obj", this.PostObj);
            this.PostObj = {
                ...this.PostObj,
                ...blogObj,
            };
            this.modal.msg.title = "Success";
            this.modal.msg.text = "Succesfully edited the blog post";
            this.modal.loading.visible = false;
            this.modal.msg.visible = true;
        },
        closeMsgModal() {
            this.modal.msg.visible = false;
        },
        closeConfModal() {
            this.modal.conf.visible = false;
        },
    },
    async mounted() {
        this.isStaff = await isStaff();
        this.PostObj = this.Post;
        this.ready = true;
    },
    components: {
        BlogPostContent,
        NewBlogPost,
    },
};
</script>

<style scoped>
.container {
    margin: 0;
    cursor: pointer;
    overflow-x: hidden;
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
    margin: 1rem auto;
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
    z-index: 1;
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
#editButton {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    width: 60px;
    height: 60px;
    border-radius: 30px;
}
</style>