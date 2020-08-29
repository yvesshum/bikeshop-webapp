<template>
  <div id="blogPostContent">
    <b-button variant="light" id="closeBtn" @click="closeHandler">
      <font-awesome-icon icon="times" class="icon alt" size="lg" />
    </b-button>
    <p class="title">{{ post.title }}</p>
    <p class="subtitle">{{ post.subtitle }}</p>
    <div class="details">
      <p class="posted">Posted {{ posted }}</p>
      <p class="posted">by {{ post.posterName }}</p>
    </div>

    <p v-html="post.content"></p>
  </div>
</template>

<script>
import { db } from "../../firebase";
import PageHeader from "@/components/PageHeader.vue";
import moment from "moment";
export default {
  name: "BlogPost",
  props: {
    post: Object,
    closeHandler: Function,
  },

  computed: {
    posted: function() {
      return moment(this.post.time.toDate()).calendar();
    },
  },

  components: {
    PageHeader,
  },

  methods: {},
};
</script>

<style scoped>
.title {
  font-size: 28pt;
  font-weight: 500;
  padding-left: 0;
}
.subtitle {
  font-weight: 300;
  font-size: 22pt;
}
.posted {
  font-size: 14pt;
}
.details {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

#blogPostContent {
  padding: 2rem;
}

#closeBtn {
  position: absolute;
  top: 5pt;
  right: 5pt;
}
</style>
