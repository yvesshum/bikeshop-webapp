<template>
  <div>
    <div v-if="ready">
      <top-bar />
      <h1 class="title">{{ this.blog.name }}</h1>
      <PageHeader
        pageCategory="Staff Headers"
        pageName="Blog Page"
      ></PageHeader>
      <!-- Blog post cards -->
      <div style="padding: 0 1rem">
        <BlogPostCard v-for="post in blogPosts" :key="post.id" :Post="post" />
      </div>

      <b-button @click="fetchMoreBlogs">load more blogs</b-button>

      <NewBlogPost />

      <Footer />
    </div>
    <div v-else>
      <b-spinner />
    </div>
  </div>
</template>

<script>
import { db } from "../../firebase";
import PageHeader from "@/components/PageHeader.vue";
import BlogPostCard from "@/components/BlogPostCard.vue";
import NewBlogPost from "@/components/NewBlogPost.vue";

const limit = 1;
export default {
  name: "BlogPage",
  data() {
    return {
      ready: false,
      blog: {
        name: "",
        description: "",
        created: "",
        id: "",
      },
      blogPosts: [],
      lastSeenDocSnapshot: null,
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
        window.alert("There aren't any more posts!");
      }

      return postQuery.docs.map((doc) => {
        return {
          id: doc.id,
          ...doc.data(),
        };
      });
    },

    async fetchMoreBlogs() {
      console.log("fetch", this.lastSeenDocSnapshot);
      let posts = await this.getBlogPosts(this.lastSeenDocSnapshot);
      this.blogPosts = this.blogPosts.concat(posts);
    },
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
