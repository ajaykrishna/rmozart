const Rule = require('./Rule');
const RuleUtils = require('./RuleUtils');
const page = require('page');
const Utils = require('../utils');

/**
 * A summary of a Rule in card format
 * @constructor
 * @param {Gateway} gateway - global Gateway with which to communicate
 * @param {Element} elt - element into which to put the card
 * @param {String} id - unique identifier of the rule card
 * @param {RuleDescription} desc - rule description to represent
 */
function VscadRuleCardItem(gateway, elt, id, desc) {
  this.elt = elt;
  this.id = id;
  this.rule = new Rule(gateway, desc);

  let invalidWarning = '';
  if (!this.rule.valid()) {
    checked = '';
    invalidWarning = '[INVALID] ';
    this.elt.classList.add('invalid');
  }

  let iconTrigger = '/optimized-images/thing-icons/thing.svg';
  let iconEffect = '/optimized-images/thing-icons/thing.svg';

  if (this.rule.trigger) {
    let trigger = this.rule.trigger;
    if (trigger.triggers && trigger.triggers.length > 0) {
      trigger = trigger.triggers[0];
    }
    const thingTrigger = RuleUtils.thingFromPart(gateway, trigger);
    if (thingTrigger) {
      iconTrigger = RuleUtils.icon(thingTrigger);
    } else if (trigger.type === 'TimeTrigger') {
      iconTrigger = '/optimized-images/thing-icons/clock.svg';
    }
  }

  if (this.rule.effect) {
    let effect = this.rule.effect;
    if (effect.effects && effect.effects.length > 0) {
      effect = effect.effects[0];
    }
    const thingEffect = RuleUtils.thingFromPart(gateway, effect);
    if (thingEffect) {
      iconEffect = RuleUtils.icon(thingEffect);
    }
  }

  this.elt.innerHTML = `
    <div class="rule-part-block trigger">
     <img class="rule-part-icon" src="${iconTrigger}"/>
    </div>
    <div class="rule-info">
      <h3>${invalidWarning}${Utils.escapeHtml(this.rule.name)}</h3>
    </div>
  `;

}




module.exports = VscadRuleCardItem;
