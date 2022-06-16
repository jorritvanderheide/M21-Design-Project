// Make the DIV elements draggable
var nodes = document.getElementsByClassName("circle");
var nodes2 = document.getElementsByClassName("circle2");
var nodes3 = document.getElementsByClassName("circle3");
var nodes4 = document.getElementsByClassName("circle4");
var nodes5 = document.getElementsByClassName("circle5");
var nodes6 = document.getElementsByClassName("circle6");

var overlappedNode;

// Repeat for node length
for (var i = 0; i < nodes.length; i++) {
  dragElement(nodes.item(i), i);
  dragElement2(nodes2.item(i), i);
  dragElement2(nodes3.item(i), i);
  dragElement2(nodes4.item(i), i);
  dragElement2(nodes5.item(i), i);
  dragElement2(nodes6.item(i), i);
}

function dragElement(elmnt, nodeNumber) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  if (document.getElementById(elmnt.id)) {
    // If present, the header is where you move the DIV from
    document.getElementById(elmnt.id).onmousedown = dragMouseDown;
  } else {
    // Otherwise, move the DIV from anywhere inside the DIV
    elmnt.onmousedown = dragMouseDown;
  }

  // On mouse press
  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // Get the mouse cursor position at startup
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // Call a function whenever the cursor moves
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // Calculate the new cursor position
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

    overlap(nodeNumber);

    // Set the element's new position:
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }

  // On mouse release
  function closeDragElement() {
    // Stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }

  // Runs if a node is overlapping, and forms a lense
  function overlap(nodeNumber) {
    // Run for each node
    for (var i = 0; i < nodes.length; i++) {
      // Makes sure overlapping with itself is disabled
      if (i != nodeNumber) {
        var position = nodes.item(i).getBoundingClientRect();
        // If nodes overlap
        if (
          ((pos3 - 50 > position.left && pos3 - 50 < position.right) ||
            (pos3 + 50 > position.left && pos3 + 50 < position.right)) &&
          ((pos4 - 50 > position.top && pos4 - 50 < position.bottom) ||
            (pos4 + 50 > position.top && pos4 + 50 < position.bottom))
        ) {
          // Set overlap in CSS
          overlappedNode = i;
          document.getElementById("title").classList.add("block");
          document.getElementById("cat1").innerHTML = nodes[i].firstElementChild.innerHTML;
          document.getElementById("cat1").style.color = window.getComputedStyle(nodes[i]).backgroundColor;
          document.getElementById("cat2").innerHTML = elmnt.firstElementChild.innerHTML;
          document.getElementById("cat2").style.color = window.getComputedStyle(elmnt).borderColor;
          elmnt.classList.add("overlap-top");
          nodes[i].classList.add("overlap-bot");
          break;
          // If nodes don't overlap
        } else if (
          (pos3 - 50 <= position.left ||
            pos3 - 50 >= position.right ||
            pos3 + 50 <= position.left ||
            pos3 + 50 >= position.right) &&
          (pos4 - 50 <= position.top ||
            pos4 - 50 >= position.bottom ||
            pos4 + 50 <= position.top ||
            pos4 + 50 >= position.bottom)
        ) {
          // Set no overlap in CSS
          overlappedNode = null;
          document.getElementById("title").classList.remove("block");
          elmnt.classList.remove("overlap-top");
          nodes[i].classList.remove("overlap-bot");
        }
      }
    }
  }
}

// This is the same function as above, but runs in paralel to the first one
function dragElement2(elmnt) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  if (document.getElementById(elmnt.id)) {
    // If present, the header is where you move the DIV from:
    document.getElementById(elmnt.id).onmousedown = dragMouseDown;
  } else {
    // Otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // Get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // Call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

    // set the element's new position:
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// Event llistener for lense clicks
document.addEventListener(
  "click",
  function (event) {
    if (!event.target.matches('[id*="node-people"]')) return;

    // Set lense to people
    if (document.getElementById("node-people").classList.contains("overlap-top")) {
      document.getElementById("node-people").classList.add("big-lense");
      document.getElementById("message").innerHTML = "You are currently viewing";
      var squares = document.getElementsByClassName("circle");
      for (var i = 0; i < squares.length; i++) {
        squares.item(i).classList.add("hidden");
        document.getElementById("node-people").classList.remove("hidden");
      }
      showOrder2("people", "darkslateblue");
    }
  },
  false
);

document.addEventListener(
  "click",
  function (event) {
    if (!event.target.matches('[id*="node-ways-of-working"]')) return;

    // Set lense to ways of working
    if (document.getElementById("node-ways-of-working").classList.contains("overlap-top")) {
      document.getElementById("node-ways-of-working").classList.add("big-lense");
      document.getElementById("message").innerHTML = "You are currently viewing";
      var squares = document.getElementsByClassName("circle");
      for (var i = 0; i < squares.length; i++) {
        squares.item(i).classList.add("hidden");
        document.getElementById("node-ways-of-working").classList.remove("hidden");
      }
      showOrder2("ways-of-working", "darkolivegreen");
    }
  },
  false
);

document.addEventListener(
  "click",
  function (event) {
    if (!event.target.matches('[id*="node-output"]')) return;

    // Set lense to output
    if (document.getElementById("node-output").classList.contains("overlap-top")) {
      document.getElementById("node-output").classList.add("big-lense");
      document.getElementById("message").innerHTML = "You are currently viewing";
      var squares = document.getElementsByClassName("circle");
      for (var i = 0; i < squares.length; i++) {
        squares.item(i).classList.add("hidden");
        document.getElementById("node-output").classList.remove("hidden");
      }
      showOrder2("output", "darkviolet");
    }
  },
  false
);

document.addEventListener(
  "click",
  function (event) {
    if (!event.target.matches('[id*="node-outcome"]')) return;

    // Set lense to outcome
    if (document.getElementById("node-outcome").classList.contains("overlap-top")) {
      document.getElementById("node-outcome").classList.add("big-lense");
      document.getElementById("message").innerHTML = "You are currently viewing";
      var squares = document.getElementsByClassName("circle");
      for (var i = 0; i < squares.length; i++) {
        squares.item(i).classList.add("hidden");
        document.getElementById("node-outcome").classList.remove("hidden");
      }
      showOrder2("outcome", "darkgoldenrod");
    }
  },
  false
);

document.addEventListener(
  "click",
  function (event) {
    if (!event.target.matches('[id*="node-impact"]')) return;

    // Set lense to impact
    if (document.getElementById("node-impact").classList.contains("overlap-top")) {
      document.getElementById("node-impact").classList.add("big-lense");
      document.getElementById("message").innerHTML = "You are currently viewing";
      var squares = document.getElementsByClassName("circle");
      for (var i = 0; i < squares.length; i++) {
        squares.item(i).classList.add("hidden");
        document.getElementById("node-impact").classList.remove("hidden");
      }
      showOrder2("impact", "darkorange");
    }
  },
  false
);

// This function makes sure lenses and text correspond to the right type of node
function showOrder2(lense, lenseColor) {
  var clean = document.getElementsByClassName(".circle-side");

  for (var k = 0; k < clean.length; k++) {
    clean.item(k).classList.remove("active");
    clean.item(k).classList.remove("nopointer");
  }

  document.getElementById("lense-" + lense).classList.add("active");
  if (overlappedNode == 0) {
    document.getElementById("people-view").classList.remove("hidden");
    document.getElementById("lenses").classList.remove("hidden");
    document.getElementById("lense-" + lense).style.backgroundColor = "#ccc";
    document.getElementById("lense-" + lense).style.border = "solid 5px " + lenseColor;
    document.getElementById("lense-people").classList.add("nopointer");
  } else if (overlappedNode == 1) {
    document.getElementById("ways-view").classList.remove("hidden");
    document.getElementById("lenses").classList.remove("hidden");
    document.getElementById("lense-" + lense).style.backgroundColor = "#ccc";
    document.getElementById("lense-" + lense).style.border = "solid 5px " + lenseColor;
    document.getElementById("lense-ways-of-working").classList.add("nopointer");
  } else if (overlappedNode == 2) {
    document.getElementById("output-view").classList.remove("hidden");
    document.getElementById("lenses").classList.remove("hidden");
    document.getElementById("lense-" + lense).style.backgroundColor = "#ccc";
    document.getElementById("lense-" + lense).style.border = "solid 5px " + lenseColor;
    document.getElementById("lense-output").classList.add("nopointer");
  } else if (overlappedNode == 3) {
    document.getElementById("outcome-view").classList.remove("hidden");
    document.getElementById("lenses").classList.remove("hidden");
    document.getElementById("lense-" + lense).style.backgroundColor = "#ccc";
    document.getElementById("lense-" + lense).style.border = "solid 5px " + lenseColor;
    document.getElementById("lense-outcome").classList.add("nopointer");
  } else if (overlappedNode == 4) {
    document.getElementById("impact-view").classList.remove("hidden");
    document.getElementById("lenses").classList.remove("hidden");
    document.getElementById("lense-" + lense).style.backgroundColor = "#ccc";
    document.getElementById("lense-" + lense).style.border = "solid 5px " + lenseColor;
    document.getElementById("lense-impact").classList.add("nopointer");
  }
}

// Event listener that sets node colors based on lense
document.addEventListener(
  "click",
  function (event) {
    if (!event.target.matches('[id*="lense-people"]')) return;
    if (
      document.getElementById("lense-people").classList.contains("active") ||
      document.getElementById("lense-people").classList.contains("nopointer")
    )
      return;

    document.getElementById("lense-people").style.backgroundColor = "darkslateblue";
    document.getElementById("lense-ways-of-working").style.backgroundColor = "darkolivegreen";
    document.getElementById("lense-output").style.backgroundColor = "darkviolet";
    document.getElementById("lense-outcome").style.backgroundColor = "darkgoldenrod";
    document.getElementById("lense-impact").style.backgroundColor = "darkorange";

    document.getElementById("lense-ways-of-working").classList.remove("active");
    document.getElementById("lense-output").classList.remove("active");
    document.getElementById("lense-outcome").classList.remove("active");
    document.getElementById("lense-impact").classList.remove("active");

    var bl = document.getElementsByClassName("big-lense");
    for (var k = 0; k < bl.length; k++) {
      bl.item(k).style.border = "solid 25px darkslateblue";
      document.getElementById("cat2").innerHTML = "People";
      document.getElementById("cat2").style.color = "darkslateblue";
      document.getElementById("lense-people").style.backgroundColor = "#ccc";
      document.getElementById("lense-people").style.border = "solid 5px darkslateblue";
    }
  },
  false
);

// Event listener that sets node colors based on lense
document.addEventListener(
  "click",
  function (event) {
    if (!event.target.matches('[id*="lense-ways-of-working"]')) return;
    if (
      document.getElementById("lense-ways-of-working").classList.contains("active") ||
      document.getElementById("lense-ways-of-working").classList.contains("nopointer")
    )
      return;

    document.getElementById("lense-people").style.backgroundColor = "darkslateblue";
    document.getElementById("lense-ways-of-working").style.backgroundColor = "darkolivegreen";
    document.getElementById("lense-output").style.backgroundColor = "darkviolet";
    document.getElementById("lense-outcome").style.backgroundColor = "darkgoldenrod";
    document.getElementById("lense-impact").style.backgroundColor = "darkorange";

    document.getElementById("lense-people").classList.remove("active");
    document.getElementById("lense-output").classList.remove("active");
    document.getElementById("lense-outcome").classList.remove("active");
    document.getElementById("lense-impact").classList.remove("active");

    var bl = document.getElementsByClassName("big-lense");
    for (var k = 0; k < bl.length; k++) {
      bl.item(k).style.border = "solid 25px darkolivegreen";
      document.getElementById("cat2").innerHTML = "Ways of Working";
      document.getElementById("cat2").style.color = "darkolivegreen";
      document.getElementById("lense-ways-of-working").style.backgroundColor = "#ccc";
      document.getElementById("lense-ways-of-working").style.border = "solid 5px darkolivegreen";
    }
  },
  false
);

// Event listener that sets node colors based on lense
document.addEventListener(
  "click",
  function (event) {
    if (!event.target.matches('[id*="lense-output"]')) return;
    if (
      document.getElementById("lense-output").classList.contains("active") ||
      document.getElementById("lense-output").classList.contains("nopointer")
    )
      return;

    document.getElementById("lense-people").style.backgroundColor = "darkslateblue";
    document.getElementById("lense-ways-of-working").style.backgroundColor = "darkolivegreen";
    document.getElementById("lense-output").style.backgroundColor = "darkviolet";
    document.getElementById("lense-outcome").style.backgroundColor = "darkgoldenrod";
    document.getElementById("lense-impact").style.backgroundColor = "darkorange";

    document.getElementById("lense-people").classList.remove("active");
    document.getElementById("lense-ways-of-working").classList.remove("active");
    document.getElementById("lense-outcome").classList.remove("active");
    document.getElementById("lense-impact").classList.remove("active");

    var bl = document.getElementsByClassName("big-lense");
    for (var k = 0; k < bl.length; k++) {
      bl.item(k).style.border = "solid 25px darkviolet";
      document.getElementById("cat2").innerHTML = "Output";
      document.getElementById("cat2").style.color = "darkviolet";
      document.getElementById("lense-output").style.backgroundColor = "#ccc";
      document.getElementById("lense-output").style.border = "solid 5px darkviolet";
    }
  },
  false
);

// Event listener that sets node colors based on lense
document.addEventListener(
  "click",
  function (event) {
    if (!event.target.matches('[id*="lense-outcome"]')) return;
    if (
      document.getElementById("lense-outcome").classList.contains("active") ||
      document.getElementById("lense-outcome").classList.contains("nopointer")
    )
      return;

    document.getElementById("lense-people").style.backgroundColor = "darkslateblue";
    document.getElementById("lense-ways-of-working").style.backgroundColor = "darkolivegreen";
    document.getElementById("lense-output").style.backgroundColor = "darkviolet";
    document.getElementById("lense-outcome").style.backgroundColor = "darkgoldenrod";
    document.getElementById("lense-impact").style.backgroundColor = "darkorange";

    document.getElementById("lense-people").classList.remove("active");
    document.getElementById("lense-ways-of-working").classList.remove("active");
    document.getElementById("lense-output").classList.remove("active");
    document.getElementById("lense-impact").classList.remove("active");

    var bl = document.getElementsByClassName("big-lense");
    for (var k = 0; k < bl.length; k++) {
      bl.item(k).style.border = "solid 25px darkgoldenrod";
      document.getElementById("cat2").innerHTML = "Outcome";
      document.getElementById("cat2").style.color = "darkgoldenrod";
      document.getElementById("lense-outcome").style.backgroundColor = "#ccc";
      document.getElementById("lense-outcome").style.border = "solid 5px darkgoldenrod";
    }
  },
  false
);

// Event listener that sets node colors based on lense
document.addEventListener(
  "click",
  function (event) {
    if (!event.target.matches('[id*="lense-impact"]')) return;
    if (
      document.getElementById("lense-impact").classList.contains("active") ||
      document.getElementById("lense-impact").classList.contains("nopointer")
    )
      return;

    document.getElementById("lense-people").style.backgroundColor = "darkslateblue";
    document.getElementById("lense-ways-of-working").style.backgroundColor = "darkolivegreen";
    document.getElementById("lense-output").style.backgroundColor = "darkviolet";
    document.getElementById("lense-outcome").style.backgroundColor = "darkgoldenrod";
    document.getElementById("lense-impact").style.backgroundColor = "darkorange";

    document.getElementById("lense-people").classList.remove("active");
    document.getElementById("lense-ways-of-working").classList.remove("active");
    document.getElementById("lense-output").classList.remove("active");
    document.getElementById("lense-outcome").classList.remove("active");

    var bl = document.getElementsByClassName("big-lense");
    for (var k = 0; k < bl.length; k++) {
      bl.item(k).style.border = "solid 25px darkorange";
      document.getElementById("cat2").innerHTML = "Impact";
      document.getElementById("cat2").style.color = "darkorange";
      document.getElementById("lense-impact").style.backgroundColor = "#ccc";
      document.getElementById("lense-impact").style.border = "solid 5px darkorange";
    }
  },
  false
);
