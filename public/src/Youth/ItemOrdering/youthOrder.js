/*
Objective:
Create an order form that is accessible by youth to place orders.
This form should have field checking, and returns an error if a required field is not entered
The form will then send the data to firestore

Steps:
1. Grab a list of fields (both required and optional ones)
2. Create input form based on these fields
3. On submit, checks if all required fields is not empty
4. Either sends the data, or window alert that a field is required
 */



var db = firebase.firestore();
var fieldsRef = db.collection("GlobalFieldsCollection").doc("Youth Order Form");
var targetID = $("#youthOrderInputForm");
var dataRef = db.collection("GlobalPendingOrders");

async function getFields() {
    return new Promise(resolve => {
        resolve(this.fieldsRef.get().then(doc => {
            return doc.data();
        }));
    });
}

async function createForm() {
    //getting the needed fields and storing it
    var fields = await getFields();
    var requiredFields = fields["required"];
    var optionalFields = fields["optional"];

    //creating text boxes for these fields w/ placeholder text


    targetID.append("<h3><b>Required:</b></h3>");
    for (var i = 0; i < requiredFields.length; i++) {
        targetID.append("<textarea id = \'" + requiredFields[i] +
            " TextID\' placeholder = \'" + requiredFields[i]  + "\' ></textarea>" );
        targetID.append("<br>")
    }
    targetID.append("<h3><b>Optional:</b></h3>");
    for (var i = 0; i < optionalFields.length; i++) {
        targetID.append("<textarea id = \'" + optionalFields[i] +
            " TextID\' placeholder = \'" + optionalFields[i]  + "\' ></textarea>" );
        targetID.append("<br>")
    }
    targetID.append("<br>");
    //adding a button that submits the data
    targetID.append('<button id = "addOrderButton">submit!</button>');
    targetID.append('<p id = "submitStatus"></p>');


    $('#addOrderButton')[0].addEventListener("click", () => {
        var elements = $(targetID)[0].getElementsByTagName('textarea'); //gets all the text boxes
        var submitRef = (dataRef).doc(new Date().toISOString());
        // var submitRef = (dataRef).doc(elements[0].value); //We want to label the document by timestamp
        var input = {};
        for (var i = 0; i < elements.length; i ++) {
            input[elements[i].placeholder] = elements[i].value;
        }
        input["Status"] = "Pending";
        //check if required fields have been entered
        //console.log(input["Item Cost"] === "");
        var isValidData = true;
        for (var fieldIndex = 0; fieldIndex < requiredFields.length; fieldIndex++) {
            if (input[requiredFields[fieldIndex]] === "") {
                window.alert(requiredFields[fieldIndex] + " is empty");
                isValidData = false;
            }
        }


        if (isValidData) {
            console.log("data is valid");
            // check if cost value > youth's hours
            var youthID = document.getElementById("Youth ID TextID").value;
            var youthDocRef = db.collection("GlobalYouthProfile").doc(youthID);
            youthDocRef.get().then(function (doc) {
                if (doc.exists) {
                    console.log(doc.data());
                    if (parseFloat(input["Item Cost"]) > parseFloat(doc.data()["Current Hours"])) {
                        window.alert("You don't have enough funds for this item! Your current hours is: " +
                            doc.data()["Current Hours"] + " but the item costs: " + input["Item Cost"] + ". Also, FYI your pending hours are: " + doc.data()["Pending Hours"]);
                    }
                    else {
                        submitRef.set(input);
                        //update youthDocRef with new funds
                        var newInput = doc.data();
                        // console.log(parseFloat(newInput["Current Hours"]));
                        newInput["Current Hours"] = (parseFloat(newInput["Current Hours"]) - parseFloat(input["Item Cost"])).toString(10);
                        newInput["Pending Hours"] = (parseFloat(newInput["Pending Hours"]) - parseFloat(input["Item Cost"])).toString(10);
                        // console.log((parseFloat(newInput["Current Hours"])));
                        // console.log(parseFloat(input["Item Cost"]));
                        youthDocRef.update(newInput);
                        $('#submitStatus').text('submitted!');
                        setTimeout(function () {
                            $('#submitStatus').text('')
                        }, 2000);
                    }
                } else {
                    window.alert("Youth ID not found. Please check!")
                }
            }).catch(function (error) {
                console.log("Error getting Youth profile document:", error)
            });
        }
    });

}


createForm();