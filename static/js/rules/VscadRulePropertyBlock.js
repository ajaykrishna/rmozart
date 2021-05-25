const VscadRuleBlock = require("./VscadRuleBlock");
const RuleUtils = require("./RuleUtils");

/**
 * An element representing a device (`thing`) and a property. Can be
 * drag-and-dropped within `ruleArea` to change its role within `rule`
 * @constructor
 * @param {Element} deleteArea
 * @param {Element} ruleArea
 * @param {Function} onPresentationChange
 * @param {Function} onRuleChange
 * @param {Rule} rule
 * @param {ThingDescription} thing
 */
function VscadRulePropertyBlock(ruleArea, desc, onRuleChange, deleteArea) {
  this.deleteArea = deleteArea;
  this.onRuleChange = onRuleChange;
  let iconTrigger = "/images/thing-icons/thing.svg";
  VscadRuleBlock.call(
    this,
    ruleArea,
    this.onRuleChange,
    desc.name,
    iconTrigger,
    this.deleteArea
  );
}
VscadRulePropertyBlock.prototype.getText = function () {
  return VscadRuleBlock.prototype.getText.call(this);
};
VscadRulePropertyBlock.prototype = Object.create(VscadRuleBlock.prototype);

/**
 * On mouse up during a drag
 */
VscadRulePropertyBlock.prototype.onUp = function (clientX, clientY) {
  VscadRuleBlock.prototype.onUp.call(this, clientX, clientY);
};

module.exports = VscadRulePropertyBlock;
