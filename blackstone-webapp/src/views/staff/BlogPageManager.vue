<template>
    <div :v-if="ready">
        <div class="content">
            <top-bar />
            <!-- Manage blog pages -->
            <h1 class="title">Blog Page {{isStaff ? "Manager" : "List"}}</h1>
            <PageHeader
                :pageCategory="isStaff ? 'Staff Headers' : 'Youth Headers'"
                :pageName="isStaff ? 'Blog Page Manager' : 'Blog Page List'"
            ></PageHeader>
            <div class="classBlogsWrapper">
              <div v-for="blog in groupedBlogs" :key="blog.id">
                <div class="border d-flex rounded cardContainer">
                    <div class="blog_info_wrapper">
                        <h2 class="cardText">{{blog.name}}</h2>
                        <div class="cardText">{{blog.description}}</div>
                        <p class="cardText"
                            style="text-align: left; font-style: italic"
                        >Created on: {{blog.created.toDate().toLocaleDateString()}}</p>
                    </div>
                    <div stlye="flex: 1" class="d-flex flex-column justify-content-around">
                        <b-button variant="info" @click="handleViewClicked(blog.id)">view</b-button>
                        <b-button
                            v-if="isStaff"
                            variant="primary"
                            @click="handleEditClicked(blog.id)"
                        >edit</b-button>
                        <b-button
                            v-if="isStaff"
                            variant="danger"
                            @click="handleDeleteClicked(blog.id)"
                        >delete</b-button>
                    </div>
                </div>
            </div>
            </div>
            <br />
            <b-button v-if="isStaff" variant="success" @click="handleAddClicked">Add a new blog</b-button>
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

        <!-- Deleting -->
        <b-modal v-model="modal.delete.visible" hide-footer lazy>
            <template slot="modal-title">Deleting Blog page</template>
            <div class="d-block text-center">
                <h3>Are you sure you want to delete {{modal.delete.blog_name}}?</h3>
            </div>
            <b-button
                class="mt-3"
                block
                @click="deleteBlog()"
                variant="danger"
            >Permanently delete this blog along with all posts</b-button>
            <b-button class="mt-3" block @click="delete_closeModal()" variant="success">Cancel</b-button>
        </b-modal>
    </div>
</template>

<script>
import { db, Timestamp } from "../../firebase";

import PageHeader from "@/components/PageHeader.vue";
import { deleteCollection } from "@/scripts/dbUtils.js";
export default {
    name: "BlogPageManager",

    data() {
        return {
            blogs: {},
            ready: false,
            isStaff: false,
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
                delete: {
                    visible: false,
                    blog_name: "",
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
            return sortedBlogs;
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
            location.href = `/blog-page?id=${id}`;
        },

        handleDeleteClicked(blogID) {
            this.modal.delete.blog_id = blogID;
            this.modal.delete.blog_name = this.blogs[blogID].name;
            this.modal.delete.visible = true;
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
                    created: Timestamp.fromDate(new Date())
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
            this.modal.msg.text = "Successfully edited the blog";
            this.modal.loading.visible = false;
            this.modal.msg.visible = true;
        },

        async deleteBlog() {
            this.modal.delete.visible = false;
            this.modal.loading.visible = true;
            try {
                // console.log("1", this.modal.delete.blog_id);
                // console.log(deleteCollection);
                await deleteCollection(
                    db,
                    db
                        .collection("GlobalBlogs")
                        .doc(this.modal.delete.blog_id)
                        .collection("Posts"),
                    20
                );
                // console.log("2", this.modal.delete.blog_id);
                await db
                    .collection("GlobalBlogs")
                    .doc(this.modal.delete.blog_id)
                    .delete();
            } catch (error) {
                // console.error(error);
                window.alert(`An error has occured. Error: ${error}.`);
                return null;
            }

            this.modal.msg.title = "Success!";
            this.modal.msg.text = "Successfully deleted the blog";
            this.modal.loading.visible = false;
            this.modal.msg.visible = true;
        },

        // Modal methods
        add_closeModal() {
            this.modal.add.blog_name = "";
            this.modal.add.blog_description = "";
            this.modal.add.visible = false;
        },

        edit_closeModal() {
            this.modal.edit.blog_name = "";
            this.modal.edit.blog_description = "";
            this.modal.edit.visible = false;
        },

        closeMsgModal() {
            this.modal.msg.title = "";
            this.modal.msg.text = "";
            this.modal.msg.visible = false;
        },

        delete_closeModal() {
            this.modal.delete.blog_name = "";
            this.modal.delete.blog_id = "";
            this.modal.delete.visible = false;
        },
    },

    async mounted() {
        this.isStaff = this.$route.name === "blog-page-manager"

        this.unsubscribe = db
            .collection("GlobalBlogs")
            .onSnapshot((blogSnapshot) => {
                this.processBlogSnapshot(blogSnapshot);
                this.ready = true;
            });
    },

    beforeDestroy() {
        // console.log("Removing observer");
        this.unsubscribe();
    },

    components: {
        PageHeader,
    },
};
</script>

<style scoped>
.blog_info_wrapper {
  flex: 4;
  align-items: flex-start;
  max-width: calc(100% - 70px);
  padding-right: 8px;
}

.buttonBox {
    justify-content: space-evenly;
    display: flex;
}

.cardText {
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.cardContainer {
    max-width: 50rem;
    width: 100%;
    height: 10rem;
    margin: 20px auto;
    padding: 1rem;
}

.classBlogsWrapper {
  padding: 0 1rem
}
</style>