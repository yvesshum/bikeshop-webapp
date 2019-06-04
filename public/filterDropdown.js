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

        // var query = await this.firebaseRef.where("ActivePeriods", "array-contains", "spring19").get();
        var query = await this.firebaseRef.where(this.queryField, this.queryOperator, this.lookupValue).get();
        var records = query.docs.map(doc => {
            var ret = doc.data()
            ret["ID"] = doc.id;
            return ret;
        });
        console.log(records);
        this.data = records;
    }


    filterFunction() {
        let input, filter, ul, li, a, i;
        input = document.getElementById(this.targetDiv + " myInput");
        filter = input.value.toUpperCase();
        let div = document.getElementById(this.targetDiv + " myDropdown");
        a = div.getElementsByTagName("a");
        for (i = 0; i < a.length; i++) {
            let txtValue = a[i].textContent || a[i].innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                a[i].style.display = "";
            } else {
                a[i].style.display = "none";
            }
        }
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

            var formDiv = document.createElement('div');
            formDiv.id = this.targetDiv + " myDropdown" ;
            formDiv.setAttribute('class', "dropdown-content");

            var input = document.createElement('input');
            input.type = 'text';
            input.placeholder = "Search..";
            input.id = this.targetDiv + " myInput";


            formDiv.appendChild(input);
            document.getElementById(this.targetDiv).appendChild(formDiv);
            document.getElementById(this.targetDiv + " myInput").onkeyup = this.filterFunction;

            var button = document.createElement('button');
            button.innerHTML = "Dropdown";
            var that = this;
            button.addEventListener("click", function () {
                document.getElementById(that.targetDiv + " myDropdown").classList.toggle("show");
            });
            button.setAttribute('class', 'dropbtn');


            document.getElementById(this.targetDiv).append(button);


            for (var i = 0; i < this.data.length; i++) {
                var element = this.data[i];
                var node = document.createElement('a');
                var nodeText = document.createTextNode(this.buildText(element, this.elementFields));
                node.appendChild(nodeText);
                node.title = element.ID;
                node.href = element.ID;
                document.getElementById(this.targetDiv + " myDropdown").appendChild(node);
            }

        }
    }

}
/*
you might want to use this styling
<style>
    .dropbtn {
      background-color: #262626;
      color: white;
      padding: 16px;
      font-size: 16px;
      border: none;
      cursor: pointer;
    }

    .dropbtn:hover, .dropbtn:focus {
      background-color: #454745;
    }

    #myInput {
      border-box: box-sizing;
      background-image: url('search_icon.png');
      background-position: 14px 12px;
      background-repeat: no-repeat;
      font-size: 16px;
      padding: 14px 20px 12px 45px;
      border: none;
      border-bottom: 1px solid #ddd;
    }

    #myInput:focus {outline: 3px solid #ddd;}

    .dropdown {
      position: relative;
      display: inline-block;
    }

    .dropdown-content {
      display: none;
      position: absolute;
      background-color: #f6f6f6;
      min-width: 230px;
      overflow: auto;
      border: 1px solid #ddd;
      z-index: 1;
    }

    .dropdown-content a {
      color: black;
      padding: 12px 16px;
      text-decoration: none;
      display: block;
    }

    .dropdown a:hover {background-color: #ddd;}

    .show {display: block;}
    </style>


 */

