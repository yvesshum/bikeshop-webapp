import {db} from '../firebase';
import {firebase} from '../firebase';
import Vue from 'vue'
export default {
  install (Vue, options) {
    // Vue.prototype.$firestore_array_insert = (collection, doc, arrayName, object) => {
    //   var objectString = this.$object_to_string(object)
    //   var docRef = db.collection(collection).doc(doc)
    //   var docData = docRef.data()
    //   var array = docData[arrayName]
    //   var objectKeysRef 
    //   for(var i = 0; i < array.length; i++) {
    //     if (array[i] !== 'deleted-object') {
    //       objectKeysRef = array[i]
    //       break
    //     }
    //   }
    //   var existingKeys = this.$objectString_keys(objectKeysRef).sort()
    //   var newObjectKeys = this.$objectString_keys(objectString).sort()
    //   if (Array.prototype.equals(existingKeys, newObjectKeys)) {
    //     docRef.update({
    //       arrayName: firebase.firestore.FieldValue.arrayUnion(objectString)
    //     }).then(response => {
    //       return response
    //     })
    //   } else {
    //     return 'error'
    //   }
      Vue.prototype.$plugin_test = () => {
        return 'hi'
      }

    }
    // Vue.prototype.$firestore_array_remove = (object) => {

    // }
    // Vue.prototype.$firestore_array_update = (object) => {

    // }
    // Vue.prototype.$object_to_string = (object) => {
    //   return object
    // }
    // Vue.prototype.$objectString_keys = (objectString) => {

    // }

  }
