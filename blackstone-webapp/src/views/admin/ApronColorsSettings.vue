<template>
    <div v-if="dataLoaded">
      <div class="content">
        <top-bar/>
        <br>
        <h1>Apron Colors Settings</h1>
        <hr class="title">

        <h2 v-b-tooltip.hover title="Drag fields around to reorder them">Apron Color editor</h2>
        <hr class="subheading">

        <h3 v-b-tooltip.hover title="These are the current apron colors used to track youth skill development">Colors:</h3>
        <fieldEditor v-if="dataLoaded" ftype="colors" :elements="fields.colors" doc="Apron Colors" collection="GlobalVariables"/>
        <hr class="divider">

        <SettingsBottomNote/>
      </div>
      <Footer/>
    </div>

</template>

<script>
import SettingsBottomNote from '../../components/SettingsBottomNote.vue'
import {db} from '../../firebase.js'
import fieldEditor from '../../components/FieldEditor.vue'

export default {
  name: 'ApronColorsSettings',
  components: {
    SettingsBottomNote,
    fieldEditor

  },
  data() {
    return {
      fields: {
        colors: []
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
      let fields = await db.collection("GlobalVariables").doc("Apron Colors").get();
      fields = fields.data();
      if (fields == null) {
        window.alert("Unable to get Apron Color fields from Global Variables");
      }
      else {
        let protectedFields = []
        this.parseFields(fields["colors"], this.fields.colors, protectedFields);
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
