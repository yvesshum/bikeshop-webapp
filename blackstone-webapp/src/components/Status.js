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

  // Special value
  UPDATE: "update",

  // Special groupings of values
  X: "x", // Unused locally
  O: "+", // Used locally
  N: "n", // Status can't be changed
  T: "temp",

  // Arrays corresponding to value groups
  X_ARR: ["unused", "remove", "remove_temp"],
  O_ARR: ["used", "add", "required", "immutable", "used_temp", "add_temp"],
  N_ARR: ["required", "immutable"],
  T_ARR: ["used_temp", "add_temp", "remove_temp"],
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
    let arr = ["O", "X", "N"];
    for (var i in arr) {
      let key = arr[i];
      if (vals == STATUS[key]) {
        return STATUS[key + "_ARR"];
      }
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
    for (var key in this) {
      if (this[key] == STATUS.ADD) this[key] = STATUS.USED;
      else if (this[key] == STATUS.REMOVE) this[key] = STATUS.UNUSED;
      else if (this[key] == STATUS.ADD_T) this[key] = STATUS.USED_T;
      else if (this[key] == STATUS.REMOVE_T) delete this[key];
    };
  }

  reset() {
    for (var key in this) {
      if (this[key] == STATUS.ADD) this[key] = STATUS.UNUSED;
      else if (this[key] == STATUS.REMOVE) this[key] = STATUS.USED;
    };
  }

  set(key, new_status) {
    let old_status = this[key];
    if (new_status == STATUS.O) {
      switch (old_status) {
        case STATUS.UNUSED:
          new_status = STATUS.ADD;
          break;
        case STATUS.REMOVE:
          new_status = STATUS.USED;
          break;
        case STATUS.REMOVE_T:
          new_status = STATUS.USED_T;
          break;
        default:
          new_status = old_status;
      }
    }
    else if (new_status == STATUS.X) {
      switch (old_status) {
        case STATUS.ADD:
          new_status = STATUS.UNUSED;
          break;
        case STATUS.USED:
          new_status = STATUS.REMOVE;
          break;
        case STATUS.USED_T:
          new_status = STATUS.REMOVE_T;
          break;
        default:
          new_status = old_status;
      }
    }

    this[key] = new_status;

    return new_status;
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