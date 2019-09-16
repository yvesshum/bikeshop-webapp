export const STATUS = {

  // Standard values
  USED: "used",
  UNUSED: "unused",
  ADD: "add",
  REMOVE: "remove",
  REQ: "required",
  IMM: "immutable",

  // Special temporary/non-standard values
  USED_T: "used_temp",
  ADD_T: "add_temp",
  REMOVE_T: "remove_temp",

  // Special values
  UPDATE: "update",
  RESET: "reset",

  // Special groupings of values
  X: "x", // Unused locally
  O: "+", // Used locally
  N: "n", // Status can't be changed
  T: "temp",
  C: "change", // Status is being changed
};

// Arrays corresponding to value groups
const STATUS_ARRS = {
  [STATUS.X]: ["unused", "remove", "remove_temp"],
  [STATUS.O]: ["used", "add", "required", "immutable", "used_temp", "add_temp"],
  [STATUS.N]: ["required", "immutable"],
  [STATUS.T]: ["used_temp", "add_temp", "remove_temp"],
  [STATUS.C]: ["add", "remove", "add_temp", "remove_temp"],

  includes: function(key) {
    return Object.keys(this).includes(key);
  },
};

const STATUS_MAPS = {
  [STATUS.UPDATE]: {
    [STATUS.ADD]: STATUS.USED,
    [STATUS.REMOVE]: STATUS.UNUSED,
    [STATUS.ADD_T]: STATUS.USED_T,
    [STATUS.REMOVE_T]: undefined,
  },

  [STATUS.RESET]: {
    [STATUS.ADD]: STATUS.UNUSED,
    [STATUS.REMOVE]: STATUS.USED,
    [STATUS.ADD_T]: undefined,
    [STATUS.REMOVE_T]: STATUS.USED_T,
  },

  [STATUS.X]: {
    [STATUS.ADD]: STATUS.UNUSED,
    [STATUS.ADD_T]: undefined,
    [STATUS.USED]: STATUS.REMOVE,
    [STATUS.USED_T]: STATUS.REMOVE_T, 
  },

  [STATUS.O]: {
    [STATUS.UNUSED]: STATUS.ADD,
    [STATUS.REMOVE]: STATUS.USED,
    [STATUS.REMOVE_T]: STATUS.USED_T, 
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

export class Status {
  constructor() {}

  add(field_name, start_status) {
    this[field_name] = start_status;
  }

  add_vue(component, field_name, start_status) {
    component.$set(this, field_name, start_status);
  }

  keys() {
    return Object.keys(this);
  }

  forEach(op) {
    this.keys().forEach(op);
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
    this.set_all(STATUS.UPDATE);
  }

  reset() {
    this.set_all(STATUS.RESET);
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
    if (!this.is_status(key, STATUS.N)) {
      return this.set(key, new_status);
    }
    return new_status;
  }

  set_all(new_status) {
    this.keys().forEach( key => this.set(key, new_status) );
  }

  set_all_safe(new_status) {
    this.unfilter(STATUS.N).forEach( key => this.set(key, new_status) );
  }

  is_status(key, vals) {
    return Status.parse_status(vals).includes(this[key]);
  }

  conflicts(arr) {
    let status_only = [];
    let array_only = [];

    arr.forEach(key => {
      if (this[key] == null || this.is_status(key, STATUS.UNUSED)) array_only.push(key);
    });

    this.filter(STATUS.USED).forEach(key => {
      if (!arr.includes(key)) status_only.push(key);
    });

    if (array_only.length == 0 && status_only.length == 0) {
      return null;
    }

    return {array_only, status_only};
  }
}