import sys
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from firebase_admin import db
import pandas as pd
import math
import time 
import datetime 


def exitWithError():
    print("Usage: python3 onboarding.py -f=filename [-t=overwrite]")
    quit()
    
def isSet(val):
    if val != None and not (type(val) == float and math.isnan(val)) and not (type(val) == str and val == ""):
        return True
    return False

def ifGivenRequired(row, csv_path, db_path, youth):
    if not isSet(row[csv_path]):
        result = "Not given"
    else:
        result = str(row[csv_path])
    youth[db_path] = result
    return youth

def ifGivenOptional(row, csv_path, db_path, youth):
    if isSet(row[csv_path]):
        youth[db_path] = str(row[csv_path])
    return youth

def ifGivenOptionalBool(row, csv_path, db_path, youth):
    if isSet(row[csv_path]):
        if row[csv_path].lower() == "checked" or row[csv_path].lower() == "yes":
            youth[db_path] = True
        if row[csv_path].lower() == "unchecked" or row[csv_path].lower() == "no":
            youth[db_path] = False
    return youth
    
def parseName(name):
    spaced = name.split()
    if len(spaced) == 2:
        firstName = spaced[0]
        lastName = spaced[1]
    elif len(spaced) == 3:
        if len(spaced[1]) == 1 or (len(spaced[1]) == 2 and spaced[1][1] == "."):
            firstName = " ".join([spaced[0], spaced[1]])
            lastName = spaced[2]
        else:
            firstName = spaced[0]
            lastName = " ".join([spaced[1], spaced[2]])
    else:
        return None
    return {
        "first": firstName,
        "last": lastName
    }
    
def main():
    filename = ""
    overwrite = False
    
    argc = len(sys.argv)
    if not (argc == 2 or argc==3):
        exitWithError()
    for i in range(1, argc):
        if sys.argv[i][0:3] == "-f=":
            filename = sys.argv[i][3:]
        elif sys.argv[i] == "-t=overwrite":
            overwrite = True
        else:
            exitWithError()
    
    config = {
      "apiKey": "AIzaSyASx3iKdwsX64SrMpjxCp9rAM8aQsHJLbI",
      "authDomain": "blackstone-production.firebaseapp.com",
      "databaseURL": "https://blackstone-production.firebaseio.com",
      "storageBucket": "blackstone-production.appspot.com"
    }
    
    cred = credentials.Certificate("blackstone-key.json")
    firebase_admin.initialize_app(cred, config)

    cloud_db = firestore.client()
    
    table = pd.read_csv(str(filename) + '.csv')
    
    ref = db.reference('Youth Profile Initializers/Protected')
    protected = ref.get()
    
    for index, row in table.iterrows():
        if index == 9:
            ID = str(row["ID"])
            
            dashed = row["ID & Name"].split("-")
            fullName = "-".join(dashed[:len(dashed) - 1])
            confirmID = dashed[len(dashed) - 1]
            if confirmID != ID:
                print("ID columns in CSV don\'t match. Something\'s wrong")
                quit()
            nameRecord1 = parseName(fullName)
            nameRecord2 = parseName(row["Name"])
            if nameRecord1 == None or nameRecord2 == None:
                print("Could not parse name. Something\'s wrong")
                quit()
            if (nameRecord1["first"] != nameRecord2["first"]) or (nameRecord1["last"] != nameRecord2["last"]):
                print("Name columns in CSV don\'t match. Something\'s wrong")
                quit()
            print(nameRecord1["first"])
            print(nameRecord1["last"])
            
            newYouth = {}
            
            newYouth["First Name"] = nameRecord1["first"]
            newYouth["Last Name"] = nameRecord1["last"]
            newYouth = ifGivenRequired(row, "Parent/Guardian Name", "Primary Parent or Guardian Name", newYouth)
            newYouth = ifGivenRequired(row, "Relationship to Youth", "Primary Parent or Guardian Relationship", newYouth)
            newYouth = ifGivenRequired(row, "Parent/Guardian Phone Number", "Primary Parent or Guardian Phone", newYouth)
            newYouth = ifGivenRequired(row, "Parent/Guardian Email", "Primary Parent or Guardian Email", newYouth)
            newYouth = ifGivenRequired(row, "Parent Best Method of Contact", "Parent best method of contact", newYouth)
            newYouth = ifGivenRequired(row, "2020 Classes + Activities", "Class", newYouth)
            if isSet(row["Date of Birth"]):
                newYouth["DOB"] = datetime.datetime.strptime(row["Date of Birth"], "%m/%d/%Y")
            if isSet(row["Address"]) and isSet(row["Zipcode"]):
                newYouth["Home Address"] = str(row["Address"]) + ", " + str(row["Zipcode"])
            elif isSet(row["Address"]):
                newYouth["Home Address"] = str(row["Address"])
            elif isSet(row["Zipcode"]):
                newYouth["Home Address"] =  str(row["Zipcode"])
            if isSet(row["Youth Sex/Gender"]):
                if row["Youth Sex/Gender"] == "Male":
                    newYouth["Gender"] = "M"
                elif row["Youth Sex/Gender"] == "Female":
                    newYouth["Gender"] = "F"
                else:
                    newYouth["Gender"] = "Other"
            
            if isSet(row["Youth Race/Ethnicity"]):
                if row["Youth Sex/Gender"] == "Black/African-American/African Diaspora":
                    newYouth["Race"] = "Black or African American"
                elif row["Youth Sex/Gender"] == "White/Caucasian":
                    newYouth["Race"] = "White"
                elif row["Youth Sex/Gender"] == "Native/1st Nations/Indiginous":
                    newYouth["Race"] = "American Indian/Alaskan Native"
                else:
                    newYouth["Race"] = "Mixed race, other, or prefer not to say"
            newYouth = ifGivenOptional(row, "Youth Race/Ethnicity", "Race", newYouth)
            
            newYouth = ifGivenOptionalBool(row, "Qualifies for Free/Reduced Lunch", "Qualified for free or reduced lunch?", newYouth)
            newYouth = ifGivenOptionalBool(row, "Safety Policy", "Safety Policy Checked", newYouth)
            newYouth = ifGivenOptionalBool(row, "Liability Waiver", "Liability and Release Consents", newYouth)
            newYouth = ifGivenOptional(row, "Medical Concerns", "Allergies or Medical Issues", newYouth)
            newYouth = ifGivenOptionalBool(row, "Seek Medical Help", "Seek medical help", newYouth)
            newYouth = ifGivenOptionalBool(row, "Media Release", "Publicity Waiver", newYouth)
            newYouth = ifGivenOptional(row, "Apron Start of 2020", "Apron Color", newYouth)
            newYouth = ifGivenOptional(row, "Year Started", "Year Started", newYouth)
            if isSet(row["Year Started"]):
                newYouth["Start Date"] = datetime.datetime.strptime("1/2/" + str(int(row["Year Started"])), "%m/%d/%Y")
            newYouth["Apron Skills"] = {}
            newYouth["Old Essay Answers"] = {}
            newYouth["Essay"] = {}
            newYouth["ActivePeriods"] = {}
            
            for key in protected.keys():
                newYouth[key] = protected[key]
            
            youth_ref = cloud_db.collection(u'GlobalYouthProfile').document(ID)

            y = youth_ref.get()
            print(y)
            if y.exists and not overwrite:
                print("Not overwriting")
                ydict = y.to_dict()
                for key in ydict.keys():
                    newYouth[key] = ydict[key]
                youth_ref.set(newYouth)
            else:
                youth_ref.set(newYouth)
    

if __name__== "__main__":
    main()

