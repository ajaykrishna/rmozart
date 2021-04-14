const VscadDraggable = require('./VscadDraggable');

/**
 * An element representing a component of a rule.  Drag-and-dropped within
 * `ruleArea` to change its role within `rule`
 * @constructor
 * @param {Element} ruleArea
 * @param {Element} deleteArea
 * @param {Function} onPresentationChange
 * @param {Function} onRuleChange
 * @param {String} name
 * @param {String} icon
 * @param {number} x
 * @param {number} y
 */
function VscadRuleBlock(ruleArea, onRuleChange, name, icon, deleteArea) {
  this.role = '';
  this.rulePart = null;
  this.deleteArea = deleteArea;
  this.onRuleChange = onRuleChange;

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
       this.onRuleChange();
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

  
  this.deleteArea.classList.add('delete-active');
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
  const deleteAreaWidth = this.deleteArea.getBoundingClientRect().width;
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
  
  const deleteAreaWidth = this.deleteArea.getBoundingClientRect().width;
  
  this.ruleArea.dragging = null;
  if (clientX < deleteAreaWidth) {
    this.remove();
    
  } 
  this.deleteArea.classList.remove('delete-active');
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
