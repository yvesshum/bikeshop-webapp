<template>
    <div v-if="dataLoaded">
        <top-bar/>
        <br>
        <h1>Class Settings</h1>
        <hr class="title">

        <h2 v-b-tooltip.hover title="Drag fields around to reorder them">Class editor</h2>
        <hr class="subheading">
        <h3 v-b-tooltip.hover title="These are the current classes for youth">Classes:</h3>
        <ClassEditor sourceFieldName="Classes" :elements="fields.Classes" sourceDocument="Classes" :collectionsToEdit="['GlobalPeriods']" :subcollectionsToEdit="['metadata']"/>

        <hr class="divider">

        <SettingsBottomNote/>

    </div>

</template>

<script>
import SettingsBottomNote from '../../components/SettingsBottomNote.vue'
import {db} from '../../firebase.js'
import ClassEditor from '../../components/ClassEditor.vue';

export default {
  name: 'HourLoggingCategoriesSettings',
  components: {
    SettingsBottomNote,
    ClassEditor

  },
  data() {
    return {
      fields: {
        Classes: []
      },  
      dataLoaded: false,
    }
  },
  methods: {
    parse(item) {
      return JSON.parse(JSON.stringify(item));
    },

    parseFields(items, dest) {
      // console.log(items);
      for (let i = 0; i < items.length; i ++) {
        dest.push({
          "data": items[i],
        })
      }
    },

    async getFields() {
      let fields = await db.collection("GlobalPeriods").doc("metadata").get();
      fields = fields.data();
      // console.log(fields);
      if (fields == null) {
        window.alert("Unable to get metadata from Global Periods");
      }
      else {
        this.parseFields(fields["Classes"], this.fields.Classes);
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
