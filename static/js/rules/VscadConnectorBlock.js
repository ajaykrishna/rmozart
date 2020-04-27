const VscadDraggable = require('./VscadDraggable');
const Constants = require('../constants');

/**
 * An element representing a component of a rule.  Drag-and-dropped within
 * `ruleArea` to change its role within `rule`
 * @constructor
 * @param {Element} ruleArea
 *  * @param {Element} deleteArea
 * @param {Function} onPresentationChange
 * @param {Function} onRuleChange
 * @param {String} name
 * @param {String} icon
 * @param {number} x
 * @param {number} y
 */


function VscadConnectorBlock(ruleArea,onRuleChange, deleteArea, name) {
  this.role = '';
  this.rulePart = null;
  this.deleteArea = deleteArea;
  this.onRuleChange = onRuleChange;
  this.elt = document.createElement('div');
  this.elt.classList.add('rule-connector-container');

  if(name){
  this.setName(name);
    this.elt.innerHTML = `
      <div class="empty-space"></div>
      <div class="hint-holder">
        <h3 class="rule-connector-name">${name}</h3>
        <div class="next-hint">
          <div class="empty-space"></div>
        </div>
      </div>
    `;
  }
    else{
      this.elt.innerHTML = `
      <div class="empty-space"></div>
      <div class="hint-holder">
        <div class="next-hint">
          <div class="empty-space"></div>
        </div>
      </div>
    `;

  }

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
      this.onRuleChange();
    }
  })
  const dragHint = document.getElementById('drag-hint');
  this.flexDir = window.getComputedStyle(dragHint).flexDirection;
}

VscadConnectorBlock.prototype.setName = function(name){
  this.name = name;
  this.text = Constants.COMMANDS[name];
  if(name == "AND" || name == "OR")
  this.elt.classList.add('grid-style');
  else
  this.elt.classList.add('flex-style');
}
VscadConnectorBlock.prototype.returnChildToRuleArea = function (child) {
  child.role = '';
  for (let i = 0; i < this.children.length; i++) {
    const currentChild = this.children[i];
    if (currentChild === child) {
      this.children.splice(i, 1);

      if (this.children.length == 0) {
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
        if (this.children.length == 1) {
         this.elt.lastElementChild.classList.remove('non-visible');
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
  child.role = 'used';
  child.snapToGrid(0, 0);
  // if tey are conectors of the same type merge the items
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
          this.elt.lastElementChild.classList.add('non-visible')
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
      if(sibling){
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
  
  this.deleteArea.classList.add('delete-active');
  this.elt.classList.add('dragging');
  this.ruleArea.classList.add('drag-location-hint');
};
VscadConnectorBlock.prototype.getText = function () {
  var returnText = "( ";
  for (let i = 0; i < this.children.length; i++) {
    const child = this.children[i];
    returnText += child.getText() + (i != this.children.length - 1 ? this.text : "");
  }
  returnText += " )"
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
  const deleteAreaWidth = this.deleteArea.getBoundingClientRect().width;
  if (clientX < deleteAreaWidth) {
    this.remove();
  }
  this.ruleArea.dragging = null;
  this.deleteArea.classList.remove('delete-active');
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