//this is a JS version of filter_dropdown, useful for importing
// this is also specialized to lookup user data

class filterDropdown {
    constructor(targetDiv, fireRef, queryField, queryOperator, lookupValue, elementFields) {
        this.targetDiv = targetDiv;
        this.firebaseRef = fireRef; //i.e. firebase.collection("GlobalYouthProfile")
        this.queryField = queryField;
        this.queryOperator = queryOperator;
        this.lookupValue = lookupValue;
        this.elementFields = elementFields;
        this.data = null;
    }

    // data from firestore based on requested period
    async getData() {
        console.log('hey');
        // var query = await this.firebaseRef.where("ActivePeriods", "array-contains", "spring19").get();
        var query = await this.firebaseRef.where(this.queryField, this.queryOperator, this.lookupValue).get();
        var records = query.docs.map(doc => {
            var ret = doc.data()
            ret["ID"] = doc.id;
            return ret;
        });
        this.data = records;
    }

    //this builds the text to be displayed no the dropdown items
    buildText(object, fields) {
        var ret = "";
        fields.forEach(field => {
            ret += object[field];
            ret += " "
        });
        return ret
    }

    buildForm() {
        if (this.data === null) {
            console.error("no data found, please call getData() first.")
        }
        else {
            for (var i = 0; i < this.data.length; i ++) {
                var element = this.data[i];
                var node = document.createElement('a');
                var nodeText = document.createTextNode(this.buildText(element, this.elementFields));
                node.appendChild(nodeText);
                node.title = element.ID;
                node.href = element.ID;
                document.getElementById(this.targetDiv).appendChild(node);
            }

        }
    }



    // async function getDocs() {
    //     var snapshot =  await collectionRef.get();
    //     recordsThing = snapshot.docs.map(doc => doc.data());
    //     console.log(recordsThing);
    //     // console.log(recordsThing[0]["Make"]);
    //     recordsThing.forEach(function(element) {
    //         console.log(element["Make"]);
    //         var node = document.createElement('a');
    //         var nodeText = document.createTextNode(element["Make"]);
    //         node.appendChild(nodeText);
    //         node.title = element["Make"];
    //         node.href = element["Make"];
    //         document.getElementById("myDropdown").appendChild(node);
    //     });
    //     // console.log('s: ', snapshot.docs.map(doc => doc.data()));
    // }

}

