const PropertySelect = require('./PropertySelect');
const VscadRuleBlock = require('./VscadRuleBlock');
const RuleUtils = require('./RuleUtils');

/**
 * An element representing a device (`thing`) and a property. Can be
 * drag-and-dropped within `ruleArea` to change its role within `rule`
 * @constructor
 * @param {Element} ruleArea
 * @param {Function} onPresentationChange
 * @param {Function} onRuleChange
 * @param {Rule} rule
 * @param {ThingDescription} thing
 */
function VscadRulePropertyBlock(ruleArea,desc,gateway) {  
  let iconTrigger = '/optimized-images/thing-icons/thing.svg';

  if (desc.trigger) {
    let trigger = desc.trigger;
    if (trigger.triggers && trigger.triggers.length > 0) {
      trigger = trigger.triggers[0];
    }
    const thingTrigger = RuleUtils.thingFromPart(gateway, trigger);
    if (thingTrigger) {
      iconTrigger = RuleUtils.icon(thingTrigger);
    }
  }

  VscadRuleBlock.call(this, ruleArea, desc.name, iconTrigger);

}
VscadRulePropertyBlock.prototype.getText = function(){
  return  VscadRuleBlock.prototype.getText.call(this);
}
VscadRulePropertyBlock.prototype = Object.create(VscadRuleBlock.prototype);

/**
 * On mouse up during a drag
 */
VscadRulePropertyBlock.prototype.onUp = function( clientX, clientY) {
  VscadRuleBlock.prototype.onUp.call(this, clientX, clientY);
  console.log("up on ",this.text);
  
  
};


module.exports = VscadRulePropertyBlock;
