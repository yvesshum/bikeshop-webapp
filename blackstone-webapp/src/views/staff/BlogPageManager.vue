<template>
    <div :v-if="ready">
        <div class="content">
            <top-bar />
            <!-- Manage blog pages -->
            <h1 class="title">Blog Page Manager</h1>
            <PageHeader pageCategory="Staff Headers" pageName="Blog Page Manager"></PageHeader>
            <b-container fluid>
                <b-row v-for="(blogs, index) in groupedBlogs" :key="index" style="margin: 0 auto">
                    <b-col v-for="blog in blogs" :key="blog.id">
                        <b-card
                            :title="blog.name"
                            style="max-width: 20rem; margin: 0 auto"
                            class="mb-2"
                            tag="article"
                        >
                            <b-card-text>{{blog.description}}</b-card-text>
                            <div class="buttonBox">
                                <b-button variant="info" @click="handleViewClicked(blog.id)">view</b-button>
                                <b-button variant="primary" @click="handleEditClicked(blog.id)">edit</b-button>
                                <b-button
                                    variant="danger"
                                    @click="handleDeleteClicked(blog.id)"
                                >delete</b-button>
                            </div>
                        </b-card>
                    </b-col>
                </b-row>
            </b-container>
            <br />
            <b-button variant="success" @click="handleAddClicked">Add a new blog</b-button>
        </div>
        <Footer />

        <!-- Modals -->

        <!-- Msg -->
        <b-modal v-model="modal.msg.visible" hide-footer lazy>
            <template slot="modal-title">{{modal.msg.title}}</template>
            <div class="d-block text-center">
                <h3>{{modal.msg.text}}</h3>
            </div>
            <b-button class="mt-3" block @click="closeMsgModal" variant="primary">ok!</b-button>
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

        <!-- Adding  -->
        <b-modal v-model="modal.add.visible" hide-footer lazy>
            <template slot="modal-title">Adding A Blog</template>
            <p style="margin-bottom: 0">Blog Name</p>
            <b-form-textarea
                id="textarea"
                v-model="modal.add.blog_name"
                size="sm"
                rows="1"
                max-rows="1"
                :state="modal.add.blog_name.length != 0"
            ></b-form-textarea>
            <p style="margin-bottom: 0">Blog description</p>
            <b-form-textarea
                id="textarea"
                v-model="modal.add.blog_description"
                size="sm"
                rows="1"
                max-rows="1"
            ></b-form-textarea>

            <b-button
                class="mt-3"
                block
                @click="addBlog()"
                variant="warning"
                :disabled="modal.add.blog_name.length == 0"
            >Add a new blog</b-button>
            <b-button class="mt-3" block @click="add_closeModal()" variant="success">Cancel</b-button>
        </b-modal>

        <!-- Editing  -->
        <b-modal v-model="modal.edit.visible" hide-footer lazy>
            <template slot="modal-title">Editing A Blog</template>
            <p style="margin-bottom: 0">Blog Name</p>
            <b-form-textarea
                id="textarea"
                v-model="modal.edit.blog_name"
                size="sm"
                rows="1"
                max-rows="1"
                :state="modal.edit.blog_name.length != 0"
            ></b-form-textarea>
            <p style="margin-bottom: 0">Blog description</p>
            <b-form-textarea
                id="textarea"
                v-model="modal.edit.blog_description"
                size="sm"
                rows="1"
                max-rows="1"
            ></b-form-textarea>

            <b-button
                class="mt-3"
                block
                @click="editBlog()"
                variant="warning"
                :disabled="modal.edit.blog_name.length == 0"
            >Save blog</b-button>
            <b-button class="mt-3" block @click="edit_closeModal()" variant="success">Cancel</b-button>
        </b-modal>
    </div>
</template>

<script>
import { db } from "../../firebase";
import PageHeader from "@/components/PageHeader.vue";
import { chunk } from "lodash";
export default {
    name: "BlogPage",

    data() {
        return {
            blogs: {},
            ready: false,
            unsubscribe: null,
            modal: {
                add: {
                    visible: false,
                    blog_name: "",
                    blog_description: "",
                },
                edit: {
                    visible: false,
                    blog_name: "",
                    blog_description: "",
                    blog_id: "",
                },
                loading: {
                    visible: false,
                },
                msg: {
                    visible: false,
                    title: "",
                    text: "",
                },
            },
        };
    },

    computed: {
        groupedBlogs() {
            let sortedBlogs = Object.values(this.blogs).sort((a, b) => {
                if (a.name > b.name) {
                    return 1;
                } else if (a.name < b.name) {
                    return -1;
                } else {
                    return 0;
                }
            });
            return chunk(sortedBlogs, 4);
        },
    },

    methods: {
        processBlogSnapshot(snapshot) {
            let blogs = {};
            snapshot.docs.forEach((doc) => {
                blogs[doc.id] = { ...doc.data(), id: doc.id };
            });
            this.blogs = blogs;
        },

        handleAddClicked() {
            this.modal.add.blog_name = "";
            this.modal.add.blog_description = "";
            this.modal.add.visible = true;
        },

        handleEditClicked(blogID) {
            this.modal.edit.blog_id = blogID;
            this.modal.edit.blog_name = this.blogs[blogID].name;
            this.modal.edit.blog_description = this.blogs[blogID].description;
            this.modal.edit.visible = true;
        },

        handleViewClicked(id) {
            console.log(id);
        },

        handleDeleteClicked(id) {
            console.log(id);
        },

        async addBlog() {
            this.modal.add.visible = false;
            this.modal.loading.visible = true;
            let name = this.modal.add.blog_name;
            let description = this.modal.add.blog_description;
            try {
                await db.collection("GlobalBlogs").add({
                    name,
                    description,
                });
            } catch (error) {
                window.alert(`An error has occured. Error: ${error}.`);
                return null;
            }
            this.modal.msg.title = "Success!";
            this.modal.msg.text = "Successfully added a new blog";
            this.modal.loading.visible = false;
            this.modal.msg.visible = true;
        },

        async editBlog() {
            this.modal.edit.visible = false;
            this.modal.loading.visible = true;
            let name = this.modal.edit.blog_name;
            let description = this.modal.edit.blog_description;
            try {
                await db
                    .collection("GlobalBlogs")
                    .doc(this.modal.edit.blog_id)
                    .update({
                        name,
                        description,
                    });
            } catch (error) {
                window.alert(`An error has occured. Error: ${error}.`);
                return null;
            }
            this.modal.msg.title = "Success!";
            this.modal.msg.text = "Successfully edited a new blog";
            this.modal.loading.visible = false;
            this.modal.msg.visible = true;
        },

        // Modal methods
        add_closeModal() {
            this.modal.add.blogName = "";
            this.modal.add.blog_description = "";
            this.modal.add.visible = false;
        },

        edit_closeModal() {
            this.modal.edit.blogName = "";
            this.modal.edit.blog_description = "";
            this.modal.edit.visible = false;
        },

        closeMsgModal() {
            this.modal.msg.title = "";
            this.modal.msg.text = "";
            this.modal.msg.visible = false;
        },
    },

    async mounted() {
        this.unsubscribe = db
            .collection("GlobalBlogs")
            .onSnapshot((blogSnapshot) => {
                this.processBlogSnapshot(blogSnapshot);
                this.ready = true;
            });
    },

    beforeDestroy() {
        console.log("Removing observer");
        this.unsubscribe();
    },

    components: {
        PageHeader,
    },
};
</script>

<style scoped>
.buttonBox {
    justify-content: space-evenly;
    display: flex;
}
</style>