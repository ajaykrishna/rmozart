const VscadDraggable = require('./VscadDraggable');

/**
 * An element representing a component of a rule.  Drag-and-dropped within
 * `ruleArea` to change its role within `rule`
 * @constructor
 * @param {Element} ruleArea
 * @param {Function} onPresentationChange
 * @param {Function} onRuleChange
 * @param {String} name
 * @param {String} icon
 * @param {number} x
 * @param {number} y
 */


function VscadConnectorBlock(ruleArea, name) {
  this.role = '';
  this.rulePart = null;
  this.name = name;
  this.elt = document.createElement('div');
  this.elt.classList.add('rule-connector-container');


  this.elt.innerHTML = `
    <div class="empty-space"></div>
    <div class="hint-holder">
      <h3 class="rule-connector-name">${name}</h3>
      <div class="next-hint">
        <div class="empty-space"></div>
      </div>
    </div>
  `;

  this.VscadConnectorBlock = this.elt.querySelector('.rule-connector');;

  this.ruleArea = ruleArea;

  this.onDown = this.onDown.bind(this);
  this.onMove = this.onMove.bind(this);
  this.onUp = this.onUp.bind(this);
  this.children = [];

  this.ruleArea.appendChild(this.elt);
  this.vscadDraggable = new VscadDraggable(this.elt, this.onDown, this.onMove, this.onUp);
  this.elt.addEventListener("mouseup", (event) => {
    let dragging = this.ruleArea.dragging
    if (dragging) {

      if (dragging.elt !== null && dragging.elt !== this.elt) {
       
        if (!this.isOwnParent(dragging)) {
          this.addAsChild(dragging);
        }

        this.ruleArea.dragging = null;
      } else if (dragging.elt !== this.elt) {
        this.returnChildToRuleArea(dragging);
      }
    }
  })
  const dragHint = document.getElementById('drag-hint');
  this.flexDir = window.getComputedStyle(dragHint).flexDirection;
}
VscadConnectorBlock.prototype.returnChildToRuleArea = function (child) {

  for (let i = 0; i < this.children.length; i++) {
    const currentChild = this.children[i];
    if (currentChild === child) {
      this.children.splice(i, 1);

      if (this.children.length === 0) {
        this.elt.querySelector('.non-visible').classList.remove('non-visible')
      } else {
        if (child.parent !== null) {
          // if we are deleting the firs element of the list
          if (!child.elt.previousElementSibling.previousElementSibling)
            child.elt.nextElementSibling.remove();
          else
            // deletes the h3 that comes before
            child.elt.previousElementSibling.remove();

        }
        if (this.children.length === 1) {
          this.elt.querySelector('.hint-holder').classList.remove('non-visible')
        }
      }
  
    }

  }

  //puts the elment in the rule area and deletes the old from this elt
  this.ruleArea.append(child.elt)
  child.parent = this.ruleArea;
}
VscadConnectorBlock.prototype.isOwnParent = function (dragging) {
 //if you move the mouse fast in of yu can try to put the dragin object into himself , this cheks if the element is not contained into himsef
 var isOwnParent = false;
 var tempParent = this;
 while (tempParent != null && !isOwnParent) {
   isOwnParent = (dragging == tempParent)
   tempParent = tempParent.parent;
 }
 return isOwnParent;
 }

VscadConnectorBlock.prototype.addAsChild = function (child, sibling) {
  child.parent = this;
  child.snapToGrid(0, 0);
  if(child instanceof VscadConnectorBlock && child.name == this.name && child.children){
    while(child.children.length>0) {
      var element = child.children[0];
      child.returnChildToRuleArea(element);
      this.addAsChild(element);
    }
    child.remove()
    }else{
      if (this.children.length === 0) {
        this.elt.insertBefore(child.elt, this.elt.firstElementChild.nextSibling);
        this.elt.querySelector('.empty-space').classList.add('non-visible')
      } else {
        if (this.children.length === 1) {
          this.elt.querySelector('.hint-holder').classList.add('non-visible')
        }
        let nElt = document.createElement('h3');
        nElt.innerHTML = this.name;
        nElt.classList.add("rule-connector-name");
        // if we sended a sibling we dd the element before it, else we add the element at the end
        if(sibling){
          this.elt.insertBefore(child.elt, sibling.elt);
          this.elt.insertBefore(nElt, sibling.elt);
        }else{
          this.elt.insertBefore(nElt, this.elt.lastElementChild);
          this.elt.insertBefore(child.elt, this.elt.lastElementChild);
        }
       
      }
      if(sibling)
      {
        for (let i = 0; i < this.children.length; i++) {
          const currentChild = this.children[i];
          if (currentChild === sibling) {
            this.children.splice(i, 0,child);
            i = this.children.length;
          }
        }
      
      }
      else
      this.children.push(child);
    }
  

}
/**
 * On mouse down during a drag
 */
VscadConnectorBlock.prototype.onDown = function () {
  const openSelector = this.elt.querySelector('.open');
  if (openSelector) {
    openSelector.classList.remove('open');
  }

  this.resetState = {
    transform: this.elt.style.transform,
  };
  this.ruleArea.dragging = this;
  if(this.parent && this.parent.returnChildToRuleArea){
    this.parent.returnChildToRuleArea(this);
  }
  const deleteArea = document.getElementById('rules-side-menu');
  deleteArea.classList.add('delete-active');
  this.elt.classList.add('dragging');
  this.ruleArea.classList.add('drag-location-hint');
};
VscadConnectorBlock.prototype.getText = function () {
  var returnText = "( ";
  for (let i = 0; i < this.children.length; i++) {
    const child = this.children[i];
    returnText += child.getText() + (i != this.children.length - 1 ? this.text : "");
  }
  returnText += ")"
  return returnText;
}

/**
 * On mouse move during a drag
 */
VscadConnectorBlock.prototype.onMove = function (clientX, clientY, relX, relY) {
  this.snapToGrid(relX, relY);
};

/**
 * Snap coordinates to a grid
 * @param {number} relX - x coordinate relative to ruleArea
 * @param {number} relY - y coordinate relative to ruleArea
 */
VscadConnectorBlock.prototype.snapToGrid = function (relX, relY) {
  const grid = 40;
  let x = Math.floor(((relX - this.ruleArea.scrollTop) - grid / 2) / grid) * grid + grid / 2;
  let y = Math.floor(((relY - this.ruleArea.scrollLeft) - grid / 2) / grid) * grid + grid / 2;
  if (y < 0) {
    y = 0;
  }
  if (x < 0) {
    x = 0;
  }
  this.x = x;
  this.y = y;
  this.elt.style.transform = `translate(${x}px,${y}px)`;
};

/**
 * On mouse up during a drag
 */
VscadConnectorBlock.prototype.onUp = function (clientX, clientY) {
  this.elt.classList.remove('dragging');

  const deleteArea = document.getElementById('operators-side-menu');
  const deleteAreaWidth = deleteArea.getBoundingClientRect().width;

  if (clientX < deleteAreaWidth) {
    this.remove();

  }
  this.ruleArea.dragging = null;

};

/**
 * Reset the VscadConnectorBlock to before the current drag started
 */
VscadConnectorBlock.prototype.reset = function () {
  this.elt.style.transform = this.resetState.transform;
  if (this.role === 'trigger') {
    this.VscadConnectorBlock.classList.add('trigger');
    this.VscadConnectorBlock.classList.remove('effect');
  } else if (this.role === 'effect') {
    this.VscadConnectorBlock.classList.remove('trigger');
    this.VscadConnectorBlock.classList.add('effect');
  } else {
    this.remove();
  }
};

/**
 * Initialize based on an existing partial rule
 */
VscadConnectorBlock.prototype.setRulePart = function (rulePart) {
  this.rulePart = rulePart;
  if (rulePart.trigger) {
    this.role = 'trigger';
    this.VscadConnectorBlock.classList.add('trigger');
  } else if (rulePart.effect) {
    this.role = 'effect';
    this.VscadConnectorBlock.classList.add('effect');
  }
};

/**
 * Snap to the center of the current area, aligning with siblings if part of
 * a multi effect. If centered relative to a list of siblings, index and length
 * specify this effect's relative location
 *
 * @param {number?} index - Centered relative to a list
 * @param {number?} length
 */
VscadConnectorBlock.prototype.snapToCenter = function (index, length) {
  if (!this.role) {
    return;
  }
  const dragHint = document.getElementById('drag-hint');
  const flexDir = window.getComputedStyle(dragHint).flexDirection;
  // Throw away our current coords and snap to centered on the grid

  const areaRect = this.ruleArea.getBoundingClientRect();
  const rect = this.elt.getBoundingClientRect();

  if (typeof index === 'undefined') {
    index = 0;
    length = 1;
  }
  const ratio = (index + 1) / (length + 1);


  if (flexDir === 'row') {
    const centerY = areaRect.height * ratio - rect.height / 2;

    let roleX = areaRect.width / 4 - rect.width / 2;
    if (this.role === 'effect') {
      roleX = areaRect.width * 3 / 4 - rect.width / 2;
    }

    this.snapToGrid(roleX, centerY);
  } else if (flexDir === 'column') {
    const centerX = areaRect.width * ratio - rect.width / 2;

    let roleY = areaRect.height / 4 - rect.height / 2;
    if (this.role === 'effect') {
      roleY = areaRect.height * 3 / 4 - rect.height / 2;
    }

    this.snapToGrid(centerX, roleY);
  }

  this.flexDir = flexDir;
};

/**
 * Remove the VscadConnectorBlock from the DOM and from its associated rule
 */
VscadConnectorBlock.prototype.remove = function () {
  this.children.forEach(child => {
    child.remove();
  });
  if (this.elt.parentNode) {
    this.elt.parentNode.removeChild(this.elt);
  }
  this.rulePart = null;
  this.role = 'removed';
};

module.exports = VscadConnectorBlock;