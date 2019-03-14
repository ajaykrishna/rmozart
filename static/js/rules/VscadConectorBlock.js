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
function VscadConectorBlock(ruleArea, name) {
  this.role = '';
  this.rulePart = null;
  this.name = name;
  this.elt = document.createElement('div');
  this.elt.classList.add('rule-conector-container');

  this.elt.innerHTML = `
    <div class="empty-space"></div>
    <h3 class="rule-conector-name">${name}</h3>
    <div class="next-hint">
      <div class="empty-space"></div>
    </div>
  `;

  this.VscadConectorBlock = this.elt.querySelector('.rule-conector');;

  this.ruleArea = ruleArea;

  this.onDown = this.onDown.bind(this);
  this.onMove = this.onMove.bind(this);
  this.onUp = this.onUp.bind(this);
  this.children = []; 

  this.ruleArea.appendChild(this.elt);
  this.vscadDraggable = new VscadDraggable(this.elt, this.onDown, this.onMove, this.onUp);
  this.elt.addEventListener("mouseup",(event)=>{
    
    
    
    let dragging  = this.ruleArea.dragging
  
      if(dragging.elt !== null && dragging.elt !== this.elt){
        this.addDraggedAsChild(dragging);
        this.ruleArea.dragging = null;
       }
       else if (dragging.elt !== this.elt){
         this.returnChildToRuleArea(dragging);
       }
      
    })
  const dragHint = document.getElementById('drag-hint');
  this.flexDir = window.getComputedStyle(dragHint).flexDirection;
}
VscadConectorBlock.prototype.returnChildToRuleArea = function(child) {
  // deletes the h3 that comes after
  if(child.parent!==null ){
    child.elt.nextElementSibling.remove();
  }
  //puts the elment in the rule area and deletes the old from this elt
  this.ruleArea.append(child.elt)
  child.parent = null;
  for (let i = 0; i < this.children.length; i++) {
      const currentChild = this.children[i];
      if(currentChild === child){
        this.children.splice(i,1);
      }
    }
    if(this.children.length == 0){
      let nElt = document.createElement('h3');
      nElt.innerHTML = this.name;
      nElt.classList.add("rule-conector-name");
      this.elt.insertBefore(nElt,this.elt.lastElementChild);
      this.elt.querySelector('.non-visible').classList.remove('non-visible')
    }
  }

VscadConectorBlock.prototype.addDraggedAsChild = function(child) {
    child.parent = this;
    child.snapToGrid(0,0);
    
    if(this.children.length === 0) {
      this.elt.insertBefore(child.elt,this.elt.firstElementChild.nextSibling);  
      this.elt.querySelector('.empty-space').classList.add('non-visible')
    }
    else {
      this.elt.insertBefore(child.elt,this.elt.lastElementChild);
      let nElt = document.createElement('h3');
      nElt.innerHTML = this.name;
      nElt.classList.add("rule-conector-name");
      this.elt.insertBefore(nElt,this.elt.lastElementChild);
    }
     
    this.children.push(child);
  }
/**
 * On mouse down during a drag
 */
VscadConectorBlock.prototype.onDown = function() {
  const openSelector = this.elt.querySelector('.open');
  if (openSelector) {
    openSelector.classList.remove('open');
  }

  this.resetState = {
    transform: this.elt.style.transform,
  };
  this.ruleArea.dragging = this;
  if(this.parent){
    this.parent.returnChildToRuleArea(this);
  }
  const deleteArea = document.getElementById('rules-side-menu');
  deleteArea.classList.add('delete-active');
  this.elt.classList.add('dragging');
  this.ruleArea.classList.add('drag-location-hint');
};
VscadConectorBlock.prototype.getText = function(){
  var returnText = "( ";
  for (let i = 0; i < this.children.length; i++) {
    const child = this.children[i];
    returnText += child.getText()+ (i != this.children.length-1 ? this.text : "");
  }
  returnText += ")"
  return returnText;
}

/**
 * On mouse move during a drag
 */
VscadConectorBlock.prototype.onMove = function(clientX, clientY, relX, relY) {
  this.snapToGrid(relX, relY);
};

/**
 * Snap coordinates to a grid
 * @param {number} relX - x coordinate relative to ruleArea
 * @param {number} relY - y coordinate relative to ruleArea
 */
VscadConectorBlock.prototype.snapToGrid = function(relX, relY) {
  const grid = 40;
  let x = this.ruleArea.scrollTop + Math.floor((relX - grid / 2) / grid) * grid + grid / 2;
  let y = this.ruleArea.scrollLeft + Math.floor((relY - grid / 2) / grid) * grid + grid / 2;
  if (y < 0) {y = 0;}
  if (x < 0) {x = 0;}
  this.x = x;
  this.y = y;
  this.elt.style.transform = `translate(${x}px,${y}px)`;
};

/**
 * On mouse up during a drag
 */
VscadConectorBlock.prototype.onUp = function(clientX, clientY) {
  this.elt.classList.remove('dragging');

  const deleteArea = document.getElementById('operators-side-menu');
  const deleteAreaWidth = deleteArea.getBoundingClientRect().width;
  
  if (clientX > window.innerWidth-deleteAreaWidth) {
    this.remove();
    
  } 
  this.ruleArea.dragging = null;

};

/**
 * Reset the VscadConectorBlock to before the current drag started
 */
VscadConectorBlock.prototype.reset = function() {
  this.elt.style.transform = this.resetState.transform;
  if (this.role === 'trigger') {
    this.VscadConectorBlock.classList.add('trigger');
    this.VscadConectorBlock.classList.remove('effect');
  } else if (this.role === 'effect') {
    this.VscadConectorBlock.classList.remove('trigger');
    this.VscadConectorBlock.classList.add('effect');
  } else {
    this.remove();
  }
};

/**
 * Initialize based on an existing partial rule
 */
VscadConectorBlock.prototype.setRulePart = function(rulePart) {
  this.rulePart = rulePart;
  if (rulePart.trigger) {
    this.role = 'trigger';
    this.VscadConectorBlock.classList.add('trigger');
  } else if (rulePart.effect) {
    this.role = 'effect';
    this.VscadConectorBlock.classList.add('effect');
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
VscadConectorBlock.prototype.snapToCenter = function(index, length) {
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
 * Remove the VscadConectorBlock from the DOM and from its associated rule
 */
VscadConectorBlock.prototype.remove = function() {
      this.children.forEach(child => {
        child.remove();
      });
      if(this.parent){
        this.parent.removeChild(this.elt);
      }else{
        this.ruleArea.removeChild(this.elt);
      }
  
  this.rulePart = null;
  this.role = 'removed';
};

module.exports = VscadConectorBlock;
