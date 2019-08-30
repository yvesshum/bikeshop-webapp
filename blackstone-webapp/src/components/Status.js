export const STATUS = {
  USED: "used",
  UNUSED: "unused",
  ADD: "add",
  REMOVE: "remove",
  REQ: "required",
  IMM: "immutable",
  X: "x", // ["unused", "remove"],      // Unused locally
  O: "+", // ["used", "add", "required", "immutable"],           // Used locally
  N: "n", // ["required", "immutable"], // Status can't be changed
  // TODO: C for changed (add, remove)? 
  UPDATE: "update",
  X_ARR: ["unused", "remove"],
  O_ARR: ["used", "add", "required", "immutable"],
  N_ARR: ["required", "immutable"],
};

export class Status {
  constructor() {}

  add(field_name, start_status) {
    this[field_name] = start_status;
  }

  keys() {
    return Object.keys(this);
  }

  forEach(op) {
    this.keys().forEach(op);
  }

  parse_status(vals) {
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
    vals = this.parse_status(vals);
    return this.keys().filter((p) => vals.includes(this[p]) == match);
  }

  unfilter(vals) {
    vals = this.parse_status(vals);
    return this.keys().filter(p => !vals.includes(this[p]));
  }

  update() {
    for (var key in this) {
      if (this[key] == STATUS.ADD) this[key] = STATUS.USED;
      else if (this[key] == STATUS.REMOVE) this[key] = STATUS.UNUSED;
    };
  }

  set(key, new_status) {
    let old_status = this[key];
    if (new_status == STATUS.O) {
      if (this.is_status(key, STATUS.O)) {
        new_status = this[key];
      }
      else {
        new_status = (old_status == STATUS.UNUSED) ? STATUS.ADD : STATUS.USED;
      }
    }
    else if (new_status == STATUS.X) {
      if (this.is_status(key, STATUS.X)) {
        new_status = this[key];
      }
      else {
        new_status = (old_status == STATUS.USED) ? STATUS.REMOVE : STATUS.UNUSED;
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
    return this.parse_status(vals).includes(this[key]);
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