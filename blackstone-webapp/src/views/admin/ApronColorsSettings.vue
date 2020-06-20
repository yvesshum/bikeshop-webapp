<template>
    <div v-if="dataLoaded">
      <div class="content">
        <top-bar/>
        <br>
        <h1>Apron Colors Settings</h1>
        <hr class="title">

        <h2 v-b-tooltip.hover title="Drag fields around to reorder them">Apron Color editor</h2>
        <hr class="subheading">

        <h3 v-b-tooltip.hover title="These are the current apron colors used to track youth skill development">Apron Colors:</h3>
        <ColorEditor v-if="dataLoaded" sourceFieldName="Colors" :elements="fields.colors" sourceDocument="Apron Colors" :collectionsToEdit="['GlobalYouthProfile']" :subcollectionsToEdit="[]"/>
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
import { Compact } from 'vue-color'
import ColorEditor from '../../components/ColorEditor.vue'

export default {
  name: 'ApronColorsSettings',
  components: {
    SettingsBottomNote,
    fieldEditor,
    'compact-picker': Compact,
    ColorEditor


  },
  data() {
    return {
      colors: "",
      fields: {
        colors: []
      },
      dataLoaded: false,
    }
  },
  watch: {
    colors: c => console.log(c)
  },
  methods: {
    parseFields(items, dest, protectedFields) {
      for (let i = 0; i < items.length; i ++) {
        let isProtected = protectedFields.includes(items[i]['name'])
        dest.push({
          "name": items[i]['name'],
          "color": items[i]['color'],
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
        let protectedFields = ['Gray']
        this.parseFields(fields["Colors"], this.fields.colors, protectedFields);
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
