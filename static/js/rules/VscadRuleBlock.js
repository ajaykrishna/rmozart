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
function VscadRuleBlock(ruleArea, name, icon) {
  this.role = '';
  this.rulePart = null;


  this.elt = document.createElement('div');
  this.elt.classList.add('rule-part-container');

  this.elt.innerHTML = `<div class="rule-part-block">
      <img class="rule-part-icon" src="${encodeURI(icon)}"/>
    </div>
    <div class="rule-part-info">
      <h3 class="rule-part-name">
      ${name}
      </h3>
    </div>`;

  this.VscadRuleBlock = this.elt.querySelector('.rule-part-block');

  this.ruleArea = ruleArea;

  this.onDown = this.onDown.bind(this);
  this.onMove = this.onMove.bind(this);
  this.onUp = this.onUp.bind(this);

  this.ruleArea.appendChild(this.elt);
  this.vscadDraggable = new VscadDraggable(this.elt, this.onDown, this.onMove, this.onUp);

  this.elt.addEventListener("mouseup",(event)=>{
    let dragging  = this.ruleArea.dragging
    if(dragging){
      if(dragging.elt !== null && dragging.elt !== this.elt){
        if(this.parent &&  !this.parent.isOwnParent(dragging) ){
          this.parent.addAsChild(dragging,this); 
          if (!(dragging instanceof VscadRuleBlock )&& this.parent.name != dragging.name){
              this.parent.returnChildToRuleArea(this);
              dragging.addAsChild(this)
            }
       }            
       this.ruleArea.dragging = null;
      }
      
      } 
    })

  const dragHint = document.getElementById('drag-hint');
  this.flexDir = window.getComputedStyle(dragHint).flexDirection;
}

/**
 * On mouse down during a drag
 */
VscadRuleBlock.prototype.onDown = function() {
  const openSelector = this.elt.querySelector('.open');
  if (openSelector) {
    openSelector.classList.remove('open');
  }

  this.resetState = {
    transform: this.elt.style.transform,
  };

  const deleteArea = document.getElementById('rules-side-menu');
  deleteArea.classList.add('delete-active');
  this.elt.classList.add('dragging');
  this.ruleArea.classList.add('drag-location-hint');
  this.ruleArea.dragging = this;
  if(this.parent && this.parent.returnChildToRuleArea){
    this.parent.returnChildToRuleArea(this);
  }
};

VscadRuleBlock.prototype.getText = function(){
  return this.text;  
}
/**
 * On mouse move during a drag
 */
VscadRuleBlock.prototype.onMove = function(clientX, clientY, relX, relY) {
  const ruleAreaRect = this.ruleArea.getBoundingClientRect();
  const deleteArea = document.getElementById('rules-side-menu');
  const deleteAreaWidth = deleteArea.getBoundingClientRect().width;
  if (clientX < deleteAreaWidth) {
    this.VscadRuleBlock.classList.remove('trigger');
  } else {
      this.VscadRuleBlock.classList.add('trigger');
  }

  this.snapToGrid(relX, relY);
};

/**
 * Snap coordinates to a grid
 * @param {number} relX - x coordinate relative to ruleArea
 * @param {number} relY - y coordinate relative to ruleArea
 */
VscadRuleBlock.prototype.snapToGrid = function(relX, relY) {
  const grid = 40;
  let x = Math.floor((relX - grid / 2) / grid) * grid + grid / 2;
  let y = Math.floor((relY - grid / 2) / grid) * grid + grid / 2;
  if (y < grid / 2) {y = 0;}
  if (x < grid / 2) {x = 0;}

 this.x = x;
 this.y = y;
  this.elt.style.transform = `translate(${x}px,${y}px)`;
};

/**
 * On mouse up during a drag
 */
VscadRuleBlock.prototype.onUp = function(clientX, clientY) {
  this.elt.classList.remove('dragging');
  const deleteArea = document.getElementById('rules-side-menu');
  const deleteAreaWidth = deleteArea.getBoundingClientRect().width;
  
  this.ruleArea.dragging = null;
  if (clientX < deleteAreaWidth) {
    this.remove();
    
  } 

};

/**
 * Reset the VscadRuleBlock to before the current drag started
 */
VscadRuleBlock.prototype.reset = function() {
  this.elt.style.transform = this.resetState.transform;
  if (this.role === 'trigger') {
    this.VscadRuleBlock.classList.add('trigger');
    this.VscadRuleBlock.classList.remove('effect');
  } else if (this.role === 'effect') {
    this.VscadRuleBlock.classList.remove('trigger');
    this.VscadRuleBlock.classList.add('effect');
  } else {
    this.remove();
  }
};

/**
 * Initialize based on an existing partial rule
 */
VscadRuleBlock.prototype.setRulePart = function(rulePart) {
  this.rulePart = rulePart;
  if (rulePart.trigger) {
    this.role = 'trigger';
    this.VscadRuleBlock.classList.add('trigger');
  } else if (rulePart.effect) {
    this.role = 'effect';
    this.VscadRuleBlock.classList.add('effect');
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
VscadRuleBlock.prototype.snapToCenter = function(index, length) {
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
 * Remove the VscadRuleBlock from the DOM and from its associated rule
 */
VscadRuleBlock.prototype.remove = function() {
  if (this.elt.parentNode) {
    this.elt.parentNode.removeChild(this.elt);
  }
  this.rulePart = null;
  this.role = 'removed';
};

module.exports = VscadRuleBlock;
