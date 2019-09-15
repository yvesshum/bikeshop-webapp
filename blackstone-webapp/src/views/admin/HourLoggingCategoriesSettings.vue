<template>
    <div v-if="dataLoaded">
        <top-bar/>
        <br>
        <h1>Hour Logging Categories Settings</h1>
        <hr class="title">

        <h2 v-b-tooltip.hover title="Drag fields around to reorder them">Category editor</h2>
        <hr class="subheading">

        <h3 v-b-tooltip.hover title="These are the current hour logging Categories for youth">Categories:</h3>
        <fieldEditor v-if="dataLoaded" ftype="Categories" :elements="fields.Categories" doc="Hour Logging Categories" collection="GlobalVariables"/>
        <hr class="divider">

        <SettingsBottomNote/>

    </div>

</template>

<script>
import SettingsBottomNote from '../../components/SettingsBottomNote.vue'
import {db} from '../../firebase.js'
import fieldEditor from '../../components/FieldEditor.vue'

export default {
  name: 'HourLoggingCategoriesSettings',
  components: {
    SettingsBottomNote,
    fieldEditor

  },
  data() {
    return {
      fields: {
        Categories: []
      },
      dataLoaded: false,
    }
  },
  methods: {
    parse(item) {
      return JSON.parse(JSON.stringify(item));
    },

    parseFields(items, dest, protectedFields) {
      for (let i = 0; i < items.length; i ++) {
        let isProtected = protectedFields.includes(items[i])
        dest.push({
          "name": items[i],
          "isProtected": isProtected
        })
      }
    },

    async getFields() {
      let fields = await db.collection("GlobalVariables").doc("Hour Logging Categories").get();
      fields = fields.data();
      if (fields == null) {
        window.alert("Unable to get Hour Logging Categories from Global Variables");
      }
      else {
        let protectedFields = []
        this.parseFields(fields["Categories"], this.fields.Categories, protectedFields);
        this.initialFields = this.parse(this.fields);
      }
    },

  },
  async mounted() {
    await this.getFields();
    this.dataLoaded = true;
  }

}
</script>

<style>
    hr.title {
      width: 80%
    }

    hr.subheading {
      width: 70%
    }

    hr.divider {
      width: 50%
    }

</style>
