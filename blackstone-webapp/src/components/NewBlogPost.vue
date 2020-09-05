<template>
  <b-container>
    <b-modal v-model="showModal" size="lg" @hidden="closeModal" :hide-footer="true">
      <div style="padding: 1rem 2rem;">
      <b-card-title style="margin-bottom: 1rem">Create a blog post!</b-card-title>
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
          <vue-editor v-model="blogContent" :editorToolbar="customToolbar" id="input-4"></vue-editor>
        </b-form-group>

        <b-button type="submit" variant="success" style="margin-right: 12px">Submit</b-button>
        <b-button type="reset" variant="danger">Reset</b-button>
      </b-form>
      </div>
    </b-modal>
  </b-container>
</template>

<script>
//import RichTextEditor from "@/components/RichTextEditor.vue";
import { VueEditor } from "vue2-editor";

export default {
  name: "NewBlogPost",
  props: {
    show: Boolean,
    title: {
      default: "",
      type: String
    },
    subtitle: {
      default: "",
      type: String
    },
    name: {
      default: "",
      type: String
    },
    content: {
      default: "",
      type: String
    }
  },
  watch: {
    show: function(newVal) {
      if (newVal) {
        this.showModal = true;
      }
    }
  },
  data() {
    return {
      showModal: false,
      blogTitle: this.title,
      blogSubtitle: this.subtitle,
      blogPosterName: this.name,
      blogContent: this.content,
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
  components: {
    VueEditor,
  },
  methods: {
    closeModal() {
      this.$emit('close');
    },
    onSubmit(evt) {
      evt.preventDefault();
      alert(this.title);
    },
    onReset(evt) {
      evt.preventDefault();
      this.blogTitle = "";
      this.blogSubtitle = "";
      this.blogPosterName = "";
      this.blogContent = "";
    },
  },
};
</script>

<style scoped>
.form-group {
  margin-bottom: 1.25rem;
}

::v-deep label {
  margin-bottom: 5px;
}
</style>
