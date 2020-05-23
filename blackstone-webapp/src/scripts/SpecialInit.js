import { Timestamp } from '@/firebase.js'
export function initSpecialInputVal(type) {
    switch(type) {
        case 'Integer':
            return 0;
        case 'Boolean':
            return false;
        case 'Phone': 
            return "";
        case 'Datetime':
            return Timestamp.fromDate(new Date()); // initialize to today's date
        case 'Date':
            return Timestamp.fromDate(new Date()); // initialize to today's date
        case 'Gender':
            return "M"; // leftmost element, honestly I don't know what to set the default one as :/ 
        case 'Race': 
            return null;
        case 'Grade':
            return null;
        case 'Email':
            return "";
        case 'Hours':
            return 0;
        case 'Class':
            return null; // should be fine for the selector
        case 'Period':
            return null; // should be fine for the selector 
        case 'Essay':
            return "";
        case 'Price':
            return 0;
        default:
            return "";
    
    }
}