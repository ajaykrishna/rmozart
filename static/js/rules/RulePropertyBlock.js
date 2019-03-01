const PropertySelect = require('./PropertySelect');
const RuleBlock = require('./RuleBlock');
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
function RulePropertyBlock(ruleArea) {
  RuleBlock.call(this, ruleArea,
                     'thing.name', 'RuleUtils.icon(thing)');

}

RulePropertyBlock.prototype = Object.create(RuleBlock.prototype);

/**
 * On mouse up during a drag
 */
RulePropertyBlock.prototype.onUp = function(clientX, clientY) {
  RuleBlock.prototype.onUp.call(this, clientX, clientY);
  
};


module.exports = RulePropertyBlock;
