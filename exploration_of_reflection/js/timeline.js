// Select DOM element
var container = document.getElementById("visualization");

// Create groups
var groups = new vis.DataSet();

groups.add({
  id: "tr",
  content: "Tranformation Reflection",
  order: 1,
});

groups.add({
  id: "dr",
  content: "Design & Research",
  order: 2,
});

groups.add({
  id: "cd",
  content: "Collaborating & Developing",
  order: 3,
});

// Create a DataSet (allows two way data-binding)
var items = new vis.DataSet([]);

var now = Date.now();

// Configuration for the Timeline
var options = {
  orientation: "top",
  editable: true,
  itemsAlwaysDraggable: true,
  start: Date.now() - 1000 * 60 * 60 * 24 * 3, // minus 3 days
  end: Date.now() + 1000 * 60 * 60 * 24 * 7, // plus 1 week
  height: "285px",
  onUpdate: function (item, callback) {
    new swal({
      title: "Update entry",
      text: "What activity do you want to add?",
      input: "text",
      inputValue: "",
    }).then(function (result) {
      if (result.value) {
        item.content = item.content.split("|")[0].trim() + " | " + result.value;
        callback(item); // send back adjusted new item
      }
    });
  },
};

// Create a Timeline
var timeline = new vis.Timeline(container, items, options);
timeline.setGroups(groups);

// Handle drag
function handleDragStart(event) {
  event.dataTransfer.effectAllowed = "move";
  var itemType = event.target.querySelector("span").innerHTML.split("-")[1].trim();
  var item = {
    id: new Date(),
    type: itemType,
    content: event.target.querySelector("span").innerHTML.split("-")[0].trim(),
    style:
      "color: #fff; border: none; background-color: " +
      event.target.querySelector("span").innerHTML.split("-")[2].trim(),
  };
  event.dataTransfer.setData("text", JSON.stringify(item));
}

var items = document.querySelectorAll(".items .item");

for (var i = items.length - 1; i >= 0; i--) {
  var item = items[i];
  item.addEventListener("dragstart", handleDragStart.bind(this), false);
}
