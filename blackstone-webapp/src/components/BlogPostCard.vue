<template>
    <div>
        <b-card class="post_card">
            <span class="delete_button" @click="handlePostDelete(Post.id)" v-if="isStaff">Delete</span>
            <div class="container" @click="viewBlogPost(Post.id)">
                <b-row style="margin: 1.25rem 0; width: 100%;">
                    <b-col class="blog_post_image" cols="3"></b-col>
                    <b-col style="margin-left: 1rem; text-align: left;" cols="9">
                        <b-card-title style="padding-right: 1.5rem">
                            {{
                            Post.title
                            }}
                        </b-card-title>
                        <b-card-sub-title style="margin-bottom: 8px;">
                            <i>By {{ Post.posterName }}</i>
                        </b-card-sub-title>
                        <b-card-sub-title>Posted {{ posted }}</b-card-sub-title>
                    </b-col>
                </b-row>
            </div>
        </b-card>

        <!-- Post modal -->
        <b-modal title="Title" v-model="showPostModal" size="xl" hide-footer hide-header no-fade>
            <BlogPostContent :post="Post" :closeHandler="closePostModal" />
            <b-button id="editButton" variant="info" @click="onEditClicked" v-show="isStaff">
                <font-awesome-icon icon="pen" class="icon alt" />
            </b-button>
        </b-modal>
    </div>
</template>

<script>
import BlogPostContent from "@/components/BlogPostContent.vue";
import moment from "moment";
import { isStaff } from "@/scripts/getPrivilege.js";
export default {
    name: "BlogPostCard",

    props: {
        Post: Object,
    },

    data() {
        return {
            showPostModal: false,
            isStaff: false,
        };
    },
    computed: {
        posted: function () {
            return moment(this.Post.time.toDate()).format(
                "MMM dd, YY, hh:mm a"
            );
        },
    },

    methods: {
        handlePostDelete(post_id) {
            console.log("Deleting post: ", post_id);
        },

        viewBlogPost(post_id) {
            console.log("Opening blog post: ", post_id);
            this.showPostModal = true;
        },

        closePostModal() {
            this.showPostModal = false;
        },

        onEditClicked() {
            console.log("clicked");
        },
    },

    async mounted() {
        this.isStaff = await isStaff();
    },

    components: {
        BlogPostContent,
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

#editButton {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    width: 60px;
    height: 60px;
    border-radius: 30px;
}
</style>
