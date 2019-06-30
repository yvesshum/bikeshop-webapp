# Hour Logging 

**Objective**: To allow youth to log their hours into the system

**Specifications**: 
  * There needs to be 2 pages - Check in and Check out 
  1. Check in: 
      * Youth selects their name/id and checks in
          * User will select from a filter dropdown of currently active youth
      * This sends an update to firestore changing the `Last Sign In` of the chosen student 
          * There needs to be validation that a youth has been selected 
          * The date should be in ISO format 
  2. Check out: 
      * Youth selects their name/id and checks out
          * Same procedure, selecting their name/id from a dropdown
      * They would have to input the number of hours they are trying to log for each category.
          * These categories are retrieved from the `Global Fields Collection`
      * There should be an optional field of `notes`
      * Once everything has been filled and checked for validity, it is sent to Firestore to `Global Youth Profile` -> `Global Pending Hours`
          * The key of the data field should be an ISO date of when they submitted the form. See `Global Pending Hours` for an example
      
