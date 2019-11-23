<template>
  <div class="emergency_contacts">
    <TopBar/>

    <h1>Emergency Contacts</h1>
    <br />
    <CollectionTable
      ref="contacts_table"
      :heading_data="headers"
      :collection="contacts_collection"
      :doc_formatter="doc_formatter"
      :args="table_args"
      style="width:90%;margin:auto;"
    ></CollectionTable>

  </div>
</template>

<script>
// @ is an alias to /src
import {db} from '../../firebase';
import TopBar from '@/components/TopBar';
import CollectionTable from "@/components/CollectionTable.vue"
import {filter} from "@/components/Search.js";

export default {
  name: 'profile_lookup_youth',
  components: {
    TopBar,
    CollectionTable,
  },

  data: function() {
    return {

      // The collection to draw profiles from
      contacts_collection: null,

      // The column headers for the table
      headers: [
        { // The name of the youth
          title: "Name", field: "Name",
          headerFilter: true, headerFilterFunc: filter
        },
        { // The ID of the youth
          title: "ID", field: "ID", width: 70,
          headerFilter: true, headerFilterFunc: this.id_filter
        },
        { // The information for the primary parent/guardian (name & number)
          title: "Primary Contact", field: "Primary Contact",
          formatter: this.contact_formatter("Primary Contact")
        },
        { // The information for the secondary parent/guardian (name & number)
          title: "Secondary Contact", field: "Secondary Contact",
          formatter: this.contact_formatter("Secondary Contact")
        },
        { // Any allergies or medical issues
          title: "Allergies or Medical Issues", field: "Medical"
        },
      ],
      
      // Helper function to group document data for the table
      doc_formatter: (doc) => {
        var data = doc.data();
        return {
          // The first and last name, and ID
          Name: `${data["First Name"]} ${data["Last Name"]}`,
          ID: doc.id,

          // The name and phone number for both the primary and the secondary parent or guardian
          "Primary Contact": {
            Name: data["Primary Parent or Guardian Name"],
            Phone: data["Primary Parent or Guardian Phone"]
          },
          "Secondary Contact": {
            Name: data["Secondary Parent or Guardian Name"],
            Phone: data["Secondary Parent or Guardian Phone"]
          },

          // Any allergies or medical issues
          Medical: data["Allergies or Medical Issues"]
        };
      },

      // Formatting arguments for the table
      table_args: {
        selectable: undefined,
      },
    };
  },

  // On mount, grab the collection of youth
  // TODO: Filter this somehow?
  mounted: async function() {
    this.contacts_collection = db.collection("GlobalYouthProfile");
  },

  methods: {

    // Takes the field for the column ("Primary" or "Secondary" Contact) and returns a formatting function for the cell based on that value
    contact_formatter: function(field) {
      return (cell) => {
        var data = cell.getData();
        var contact = data[field];
        return `<p style='text-align: center'>${contact.Name}<br />${contact.Phone}</p>`;
      }
    },

    // Function to filter the rows based on the ID search
    id_filter: function(headerValue, rowValue, rowData, filterParams) {
      return rowValue.indexOf(headerValue) >= 0;
    },
  },
}
</script>