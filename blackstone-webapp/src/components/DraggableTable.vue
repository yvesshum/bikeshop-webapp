<template>
  <div>
    <div class="container" style="overflow-Y: hidden">
      <div class="row " :style="getTableWidth()">
        <div class="col"><b>Categories</b></div>
        <div
          v-for="color in colors"
          v-if="color.name != 'Gray'"
          class="col-sm table-color"
          :key="color"
        >
          {{ color.name }}
          <ApronImg
            class="apron_img_style"
            :color="color.color"
            :size="32"
            :active="true"
            :name="color.name"
            :showStatus="false"
          />
        </div>
      </div>
      <div v-for="category in categories" :key="category">
        <div class="row" :style="getTableWidth()">
          <div class="col table-categories">
            <b>{{ category }}</b>
          </div>
          <div
            v-for="color in colors"
            v-if="color.name != 'Gray'"
            class="table-col col-sm"
            :key="color"
          >
            <div
              v-for="group in getGroupsByColorCategory(color, category)"
              :key="group"
              class="dragArea"
            >
              <draggable
                element="div"
                class="dragArea"
                v-model="group.skills"
                :options="getOptions(group)"
                :move="onMove"
                @start="isDragging = true"
                @end="onEnd"
              >
                <transition-group
                  type="transition"
                  :accessKey="category + '\n' + color.name"
                  :name="'flip-list'"
                  tag="ul"
                  class="dragAreaFinal"
                >
                  <div
                    class="sdt-tag sdt-tag-item table-cell"
                    v-for="(element, index) in group.skills"
                    :accessKey="element.skill"
                    :key="element.skill"
                    :style="getColorStyle(color)"
                  >
                    <!-- <textarea>{{ element.skill }}</textarea>  contenteditable? -->
                    <div
                      @keypress="restrictChars($event)"
                      onclick="this.contentEditable=true;"
                      v-on:blur="
                        reskill($event, category, color, index);
                        $event.target.contentEditable = false;
                      "
                      contenteditable="false"
                    >
                      {{ element.skill }}
                    </div>
                  </div>
                </transition-group>
              </draggable>
            </div>
          </div>
        </div>
      </div>
      <div class="trashcan">
        <img src="@/assets/trash.svg" alt="Trashcan: " />
        Drag a skill here to delete it
        <draggable
          element="span"
          :options="getOptions(placeholder)"
          :move="onMove"
          @start="isDragging = true"
          @end="onEndDelete"
        >
          <transition-group
            type="transition"
            accessKey="trashcan"
            :name="'flip-list'"
            class="trashcan-center"
            tag="ul"
          >
          </transition-group>
        </draggable>
      </div>
    </div>
  </div>
</template>

<script>
import draggable from "vuedraggable";
import { db } from "@/firebase";
import ApronImg from "@/components/ApronImg";
export default {
  name: "vue-draggable-table",
  components: {
    draggable,
    ApronImg
  },
  props: {
    colors: { type: Array, default: [] },
    categories: { type: Array, default: [] },
    groups: { type: Array, default: [] },
    changes: { type: Object, default: {} }
  },
  data() {
    return {
      placeholder: { editable: true, droppable: true, skills: [] },
      isDragging: false,
      delayedDragging: false
    };
  },
  methods: {
    change_existing(old_value, new_value, change_type) {
      for (const change_string in this.changes) {
        let change_key = change_string.split("\n");
        var old_category, old_color, old_skill;
        var changed = false;
        if (this.changes[change_string] == null) {
          old_category = change_key[0];
          old_color = change_key[1];
          old_skill = change_key[2];
        } else if (this.changes[change_string] == false) {
          continue;
        } else {
          old_category = this.changes[change_string][0];
          old_color = this.changes[change_string][1];
          old_skill = this.changes[change_string][2];
        }
        if (change_type == "del_category" && old_category == old_value) {
          this.changes[change_string] = false;
        }
        if (change_type == "del_color" && old_color == old_value) {
          this.changes[change_string] = false;
        }
        if (
          change_type == "del_skill" &&
          old_category + "\n" + old_color + "\n" + old_skill == old_value
        ) {
          this.changes[change_string] = false;
        }
        if (change_type == "category" && old_category == old_value) {
          this.changes[change_string] = [new_value, old_color, old_skill];
          changed = true;
        }
        if (change_type == "color" && old_color == old_value) {
          this.changes[change_string] = [old_category, new_value, old_skill];
          changed = true;
        }
        if (change_type == "skill" && old_skill == old_value) {
          this.changes[change_string] = [old_category, old_color, new_value];
          changed = true;
        }
        if (
          change_type == "move" &&
          old_category + "\n" + old_color + "\n" + old_skill == old_value
        ) {
          let new_category = new_value.split("\n")[0];
          let new_color = new_value.split("\n")[1];
          this.changes[change_string] = [new_category, new_color, old_skill];
          changed = true;
        }
        if (
          changed &&
          change_string == this.changes[change_string].join("\n")
        ) {
          this.changes[change_string] = null;
        }
      }
    },
    restrictChars($event) {
      if ($event.charCode === 13) {
        $event.preventDefault();
        $event.target.blur();
      } else {
        return true;
      }
    },
    reskill($event, category, color, index) {
      var group = this.getGroupsByColorCategory(color, category);
      let new_skill = $event.target.innerText.substring(0, 100);
      this.change_existing(group[0].skills[index].skill, new_skill, "skill")
      $event.target.innerText = $event.target.innerText.substring(0,100);
      group[0].skills[index].skill = new_skill;
    },
    getGroupsByColorCategory(color, category) {
      for (var i = 0; i < this.groups.length; i++) {
        if (
          this.groups[i].color == color.name &&
          this.groups[i].category == category
        ) {
          // console.log("Returning group with skills");
          // console.log(this.groups[i].skills);
          return [this.groups[i]];
        }
      }
      // console.log("Returning placeholder")
      var placeholder = this.placeholder;
      placeholder["category"] = category;
      placeholder["color"] = color.name;
      return placeholder;
    },
    getColorStyle(color) {
      return {
        border: "2px solid " + color.color,
        "border-radius": "5px;",
        "box-shadow": "2px 4px #888888"
      };
    },
    getTableWidth() {
      return { width: (this.colors.length * 225).toString() + "px" };
    },
    onClick(index, from, to) {
      var current = from.tags[index];
      if (from.editable && to.editable && to.droppable) {
        if (
          to.tags.filter(function(e) {
            return e.tag == current.tag;
          }).length === 0
        ) {
          to.tags.push(current);
        }
        from.tags.splice(index, 1);
      }
    },
    onEndDelete(evt) {
      let old_category = evt.from.accessKey.split("\n")[0];
      let old_color = evt.from.accessKey.split("\n")[1];
      let old_skill = evt.item.accessKey;
      this.isDragging = false;
      this.change_existing(
        old_category + "\n" + old_color + "\n" + old_skill,
        new_category + "\n" + new_color,
        "del_skill"
      );
    },
    onMove({ relatedContext, draggedContext }) { // eslint-disable-line no-unused-vars
      // const relatedElement = relatedContext.element;
      // const draggedElement = draggedContext.element;
      return true;
    },
    onEnd(evt) {
      let old_category = evt.from.accessKey.split("\n")[0];
      let old_color = evt.from.accessKey.split("\n")[1];
      let old_skill = evt.item.accessKey;
      if (evt.to.accessKey == "trashcan") {
        this.change_existing(
          old_category + "\n" + old_color + "\n" + old_skill,
          null,
          "del_skill"
        );
      } else {
        let new_category = evt.to.accessKey.split("\n")[0];
        let new_color = evt.to.accessKey.split("\n")[1];
        this.change_existing(
          old_category + "\n" + old_color + "\n" + old_skill,
          new_category + "\n" + new_color,
          "move"
        );
      }
      this.isDragging = false;
    },
    getOptions(place) {
      return {
        sort: true,
        animation: 0,
        group: {
          name: "skills",
          pull: true,
          put: place.droppable
        },
        disabled: !place.editable,
        ghostClass: "ghost"
      };
    }
  },
  watch: {
    isDragging(newValue) {
      if (newValue) {
        this.delayedDragging = true;
        return;
      }
      this.$nextTick(() => {
        this.delayedDragging = false;
      });
    }
  }
};
</script>

<style>
.sdt-footer p {
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 16px;
}
.sdt-footer a {
  text-decoration: none;
}
.flip-list-move {
  transition: transform 0.3s;
}
.flip-list-enter-active,
.flip-list-leave-active {
  transition: all 0.3s;
}
.flip-list-enter,
.flip-list-leave-to {
  opacity: 0;
  transform: translateY(-50px);
}
.no-move {
  transition: transform 0s;
}
.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}
.dragArea {
  height: 95%;
}

.dragAreaFinal {
  padding: 2px 15px !important;
  min-height: 100px;
  height: 95%;
}

.trashcan {
  padding: 2px 15px !important;
  min-height: 75px;
  min-width: 150px;
  border-top: 2px solid black;
  border-left: 2px solid black;
  border-right: 2px solid black;
  border-bottom: 2px solid black;
  border-radius: 5px;
  background-color: white;
  position: fixed;
  right: 5%;
  bottom: 0;
  text-align: center;
}

.trashcan-center {
  min-height: 40px;
  min-width: 150px;
}

.table-cell {
  overflow-wrap: break-word;
  font-size: 14px;
  border-radius: 5px;
}
.row {
  clear: both;
  width: 1200px;
}
.container {
  max-width: 90%;
  /* max-height: 800px; */
  overflow: scroll;
}
.table-col {
  min-width: 200px;
  border-left: 2px solid grey;
  border-top: 2px solid grey;
}
.table-categories {
  max-width: 100px;
  border-top: 2px solid grey;
}
.table-color {
  border-left: 2px solid grey;
}
.panel-body {
  margin-left: 10px;
}
.sdt-tag-icon {
  cursor: pointer;
}
.sdt-json-section:hover {
  overflow: auto !important;
}
.sdt-json-pre {
  font-family: monospace;
  font-weight: lighter;
  font-size: 12px;
}
.sdt-header {
  text-align: center;
  color: rgba(0, 0, 0, 0.64);
  margin-bottom: 45px;
  margin-top: 30px;
}
.sdt-control-tag {
  visibility: hidden !important;
  width: 5px !important;
  background: transparent !important;
  box-shadow: none !important;
  color: transparent !important;
  margin-bottom: -64px !important;
}
.sdt-sort-button {
  float: right;
  float: right;
  z-index: 9;
  bottom: -29px;
  left: 14px;
  width: 100%;
}
.sdt-tag {
  cursor: -webkit-grab !important;
  padding: 8px !important;
  min-height: 5px !important;
}
.sdt-tag:hover {
  box-shadow: 0 8px 10px 1px rgba(0, 0, 0, 0.14),
    0 3px 14px 2px rgba(0, 0, 0, 0.12), 0 5px 5px -3px rgba(0, 0, 0, 0.2);
}
.sdt-color-red {
  fill: #f44336;
  color: #f44336;
}
.sdt-color-gray {
  fill: #e0e0e0;
  color: #e0e0e0;
}
.sdt-color-teal {
  fill: #009688;
  color: #009688;
}
.sdt-color-indigo {
  fill: #3f51b5;
  color: #3f51b5;
}

.apron_img_style {
  display: inline-block;
  vertical-align: middle;
  margin-left: 5px;
}
</style>
