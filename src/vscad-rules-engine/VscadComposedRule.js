/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */
const Events = require('../rules-engine/Events');


const DEBUG = false || (process.env.NODE_ENV === 'test');
/*
{
  "enabled":true,
  "id": 1,
  "name": "Rule Name",
  "rules": [],
  "expression":"[r1 ; r3 , r2] | r4"
}
*/
class ComposedRule {
  /**
   * @param {boolean} enabled
   * @param {Trigger} trigger
   * @param {Effect} effect
   */
  constructor(enabled, rules, expression) {
    this.enabled = enabled;
    this.rules = rules;
    this.expression = expression;
  }
  /**
   * @return {RuleDescription}
   */
  toDescription() {
    const desc = {
      enabled: this.enabled,
      rules : this.rules,
      expression : this.expression
    };
    if (this.hasOwnProperty('id')) {
      desc.id = this.id;
    }
    if (this.hasOwnProperty('name')) {
      desc.name = this.name;
    }
    return desc;
  }
  /**
   * Stop executing the rule
   */
  stop() {
    this.trigger.removeListener(Events.STATE_CHANGED,
                                this.onTriggerStateChanged);
    this.trigger.stop();
    if (DEBUG) {
      console.debug('Rule.stop', this.name);
    }
  }
}
/**
 * Create a rule from a serialized description
 * @param {RuleDescription} desc
 * @return {ComposedRule}
 */
ComposedRule.fromDescription = function(desc) {
  const expression = desc.expression
  const rules = desc.rules;
  const composedRule = new ComposedRule(desc.enabled,rules,expression);
  if (desc.hasOwnProperty('id')) {
    composedRule.id = desc.id;
  }
  if (desc.hasOwnProperty('name')) {
    composedRule.name = desc.name;
  }
  return composedRule;
};

module.exports = ComposedRule;
