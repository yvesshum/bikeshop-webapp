<template>
  <div>
    <vue-editor v-model="content" :editorToolbar="customToolbar"></vue-editor>
  </div>
</template>

<script>
import { VueEditor } from "vue2-editor";

export default {
  name: "RichTextEditor",
  data() {
    return {
      content: "<h1>Some example content</h1>",
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
};
</script>
