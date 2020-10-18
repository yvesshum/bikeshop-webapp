export class Status {
  constructor() {}

  add(field_name, start_status) {
    this[field_name] = start_status;
  }

  add_vue(component, field_name, start_status) {
    component.$set(this, field_name, start_status);
  }

  delete(field_name) {
    delete this[field_name];
  }

  keys() {
    return Object.keys(this);
  }

  has_key(key) {
    return this.keys().includes(key);
  }

  forEach(op) {
    if (op.length == 1)
      this.keys().forEach(op);
    else if (op.length == 2)
      this.keys().forEach(key => op(key, this[key]));
    else if (op.length == 3)
      this.keys().forEach((key,n,arr) => op(key, this[key], arr));
  }

  static parse_status(vals) {

    if (STATUS_ARRS.includes(vals)) {
      return STATUS_ARRS[vals];
    }

    if (!Array.isArray(vals)) {
      return [vals];
    };

    return vals;
  }

  filter(vals, match) {
    if (match == undefined) match = true;
    vals = Status.parse_status(vals);
    return this.keys().filter((p) => vals.includes(this[p]) == match);
  }

  unfilter(vals) {
    vals = Status.parse_status(vals);
    return this.keys().filter(p => !vals.includes(this[p]));
  }

  update() {
    this.set_all(Status.UPDATE);
  }

  reset() {
    this.set_all(Status.RESET);
  }

  set(key, new_status) {
    if (STATUS_MAPS.includes(new_status)) {
      this[key] = STATUS_MAPS.mapped_value(this[key], new_status);
    }
    else {
      this[key] = new_status;
    }

    if (this[key] == undefined) {
      delete this[key];
      return undefined;
    }

    return this[key];
  }

  set_safe(key, new_status) {
    if (!this.is_status(key, Status.N)) {
      return this.set(key, new_status);
    }
    return new_status;
  }

  set_all(new_status) {
    this.keys().forEach( key => this.set(key, new_status) );
  }

  set_all_safe(new_status) {
    this.unfilter(Status.N).forEach( key => this.set(key, new_status) );
  }

  set_all_f(f) {
    this.forEach((key, val) => this.set(key, f(key, val)));
  }

  is_status(key, vals) {
    return Status.parse_status(vals).includes(this[key]);
  }

  has_status(vals) {
    let parsed_vals = Status.parse_status(vals);
    for (var key in this) {
      if (parsed_vals.includes(this[key])) {
        return true;
      }
    }
    return false;
  }

  conflicts(arr) {
    let status_only = [];
    let array_only = [];

    arr.forEach(key => {
      if (this[key] == null || this.is_status(key, Status.NOT)) array_only.push(key);
    });

    this.filter(Status.USE).forEach(key => {
      if (!arr.includes(key)) status_only.push(key);
    });

    if (array_only.length == 0 && status_only.length == 0) {
      return null;
    }

    return {array_only, status_only};
  }
}

var status_fields = [
  // Standard values
  "USE", "NOT", "ADD", "REM",
  // Special restricted values
  "REQ", "IMM",
  // Special temporary/non-standard values
  "USE_T", "ADD_T", "REM_T",
  // Special update values
  "UPDATE", "RESET", "TOGGLE",
  // Special groupings of values
  "X", "O", "U", "N", "T", "C"
];

status_fields.forEach(k => {
  Object.defineProperty(Status, k, {
    value: k.toLowerCase(),
    writable: false,
    enumerable: false,
    configurable: false,
  });
});

// Arrays corresponding to value groups
const STATUS_ARRS = {
  // Unused locally
  [Status.X]: [Status.NOT, Status.REM, Status.REM_T],

  // Used locally
  [Status.O]: [Status.USE, Status.ADD, Status.REQ, Status.IMM, Status.USE_T, Status.ADD_T],

  // Used non-locally
  [Status.U]: [Status.USE, Status.REM, Status.REQ, Status.IMM],

  // Status can't be changed
  [Status.N]: [Status.REQ, Status.IMM],

  // Temporary or nonstandard value
  [Status.T]: [Status.USE_T, Status.ADD_T, Status.REM_T],

  // Status is being changed
  [Status.C]: [Status.ADD, Status.REM, Status.ADD_T, Status.REM_T],

  includes: function(key) {
    return Object.keys(this).includes(key);
  },
};

const STATUS_MAPS = {
  // Accept status changes
  [Status.UPDATE]: {
    [Status.ADD]: Status.USE,
    [Status.REM]: Status.NOT,
    [Status.ADD_T]: Status.USE_T,
    [Status.REM_T]: undefined,
  },

  // Reset status changes
  [Status.RESET]: {
    [Status.ADD]: Status.NOT,
    [Status.REM]: Status.USE,
    [Status.ADD_T]: undefined,
    [Status.REM_T]: Status.USE_T,
  },

  // Deactivate status
  [Status.X]: {
    [Status.ADD]: Status.NOT,
    [Status.ADD_T]: undefined,
    [Status.USE]: Status.REM,
    [Status.USE_T]: Status.REM_T,
  },

  // Activate status
  [Status.O]: {
    [Status.NOT]: Status.ADD,
    [Status.REM]: Status.USE,
    [Status.REM_T]: Status.USE_T,
  },

  // Toggle status
  [Status.TOGGLE]: {
    [Status.ADD]: Status.NOT,
    [Status.ADD_T]: undefined,
    [Status.USE]: Status.REM,
    [Status.USE_T]: Status.REM_T,
    [Status.REM]: Status.USE,
    [Status.REM_T]: Status.USE_T,
    [Status.NOT]: Status.ADD,
  },

  mapped_value: function(key, type) {
    if (Object.keys(this[type]).includes(key)) {
      return this[type][key];
    }
    return key;
  },

  includes: function(key) {
    return Object.keys(this).includes(key);
  },
};
