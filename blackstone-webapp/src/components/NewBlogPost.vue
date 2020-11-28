<template>
        <b-modal v-model="showModal" size="lg" @hidden="closeModal" :hide-footer="true">
            <div style="padding: 1rem 2rem;">
                <b-card-title style="margin-bottom: 1rem">{{ modalTitle }}</b-card-title>
                <b-form @submit="onSubmit" @reset="onReset">
                    <!-- Title -->
                    <b-form-group id="input-group-1" label="Title:" label-for="input-1">
                        <b-form-input
                            id="input-1"
                            v-model="blogTitle"
                            required
                            placeholder="Your title here"
                        ></b-form-input>
                    </b-form-group>

        <!-- Subtitle -->
        <b-form-group id="input-group-2" label="Subtitle:" label-for="input-2">
          <b-form-input
            id="input-2"
            v-model="blogSubtitle"
            required
            placeholder="Your subtitle here"
          ></b-form-input>
        </b-form-group>

        <!-- Name -->
        <b-form-group id="input-group-3" label="Your Name:" label-for="input-3">
          <b-form-input
            id="input-3"
            v-model="blogPosterName"
            required
            placeholder="Enter name"
          ></b-form-input>
        </b-form-group>

        <b-form-group
          id="input-group-4"
          label="Post Content:"
          label-for="input-4"
        >
          <vue-editor
            v-model="blogContent"
            :editorToolbar="customToolbar"
            id="input-4"
          ></vue-editor>
        </b-form-group>

        <b-form-group
          id="input-group-5"
          label="Choose Thumbnail:"
          label-for="input-5"
        >

        <div>
          <img @click="setThumbnail(1)" class="thumbnail" v-bind:class="{'chosen':(blogThumbnail == 1)}" src="../assets/bike_thumbnail1.jpg">
          <img @click="setThumbnail(2)" class="thumbnail" v-bind:class="{'chosen':(blogThumbnail == 2)}" src="../assets/bike_thumbnail2.jpg">
          <img @click="setThumbnail(3)" class="thumbnail" v-bind:class="{'chosen':(blogThumbnail == 3)}" src="../assets/bike_thumbnail3.jpg">
        </div>
        
        </b-form-group>

                    <b-button type="submit" variant="success" style="margin-right: 12px">Submit</b-button>
                    <b-button type="reset" variant="danger">{{ resetText }}</b-button>
                </b-form>
            </div>
        </b-modal>
</template>

<script>
import { VueEditor } from "vue2-editor";

export default {
    name: "NewBlogPost",
    props: {
        show: Boolean,
        edit: {
            default: false,
            type: Boolean,
        },
        title: {
            default: "",
            type: String,
        },
        subtitle: {
            default: "",
            type: String,
        },
        name: {
            default: "",
            type: String,
        },
        content: {
            default: "",
            type: String,
        },
        thumbnail: {
            default: 0,
            type: Number,
        },
        submitCallback: {
            default: () => {},
            type: Function,
        },
    },
    data() {
        return {
            showModal: false,
            blogTitle: this.title,
            blogSubtitle: this.subtitle,
            blogPosterName: this.name,
            blogContent: this.content,
            blogThumbnail: this.thumbnail,
            customToolbar: [
                [{ header: [false, 1, 2, 3, 4, 5, 6] }],
                ["bold", "italic", "underline"],
                ["blockquote"],
                ["link"],
                [{ align: "" }, { align: "center" }, { align: "right" }],
                [{ font: [] }],
                [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
                [{ indent: "-1" }, { indent: "+1" }],
                [{ color: [] }, { background: [] }],
                ["clean"],
            ],
        };
    },
    computed: {
      modalTitle() {
        return this.edit ? "Edit Blog Post" : "Create a Blog Post!"
      },
      resetText() {
        return this.edit ? "Reset Edits" : "Reset"
      }
    },
    components: {
        VueEditor,
    },
    methods: {
        setThumbnail(i) {
          this.blogThumbnail = i
        },
        closeModal() {
            this.$emit("close");
        },
        async onSubmit(evt) {
            evt.preventDefault();
            this.submitCallback({
                content: this.blogContent,
                posterName: this.blogPosterName,
                subtitle: this.blogSubtitle,
                title: this.blogTitle,
            });
            this.onReset(evt)
        },
        onReset(evt) {
            evt.preventDefault();
            this.blogTitle = "";
            this.blogSubtitle = "";
            this.blogPosterName = "";
            this.blogContent = "";
            if (this.edit) {
              this.blogTitle = this.title;
              this.blogSubtitle = this.subtitle;
              this.blogPosterName = this.name;
              this.blogContent = this.content;
            } else {
              this.blogTitle = "";
              this.blogSubtitle = "";
              this.blogPosterName = "";
              this.blogContent = "";
            }
        },
        closeMsgModal() {
            this.modal.msg.visible = false;
        },
    },
    watch: {
        show: function (newVal) {
            if (newVal) {
                this.showModal = true;
            } else {
                this.showModal = false;
            }
        },
    },
};
</script>

<style scoped>
.form-group {
  margin-bottom: 1.25rem;
}

.thumbnail {
  opacity: 80%;
  max-width: 30%;
  display: inline-block;
  margin: 1.5%;
  border-radius: 5px;
}

.thumbnail:hover {
  opacity: 100%;
  box-shadow: 0 0 0 2px black;
  cursor: pointer;
  border-radius: 5px;
}

.chosen {
  opacity: 100%;
  box-shadow: 0 0 0 2px black;
  cursor: pointer;
  border-radius: 5px;
}

::v-deep label {
  margin-bottom: 5px;
}
</style>
