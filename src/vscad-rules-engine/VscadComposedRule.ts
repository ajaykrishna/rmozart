/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */
// import Trigger, { TriggerDescription } from '../rules-engine/triggers/Trigger';
// import Effect, { EffectDescription } from '../rules-engine/effects/Effect';
import Rule from '../rules-engine/Rule';

// const Events = require('../rules-engine/Events');

// const DEBUG = false || (process.env.NODE_ENV === 'test');
/*
{
  "enabled":true,
  "id": 1,
  "name": "Rule Name",
  "rules": [],
  "expression":"[r1 ; r3 , r2] | r4"
}
*/

export interface RuleDescription {
  enabled: boolean;
  rules: Rule[];
  expression: any;
  id?: number;
  name?: string;
}

class ComposedRule {

  private enabled: boolean;

  private rules: Rule[];

  private expression: any;

  private id?: number;

  private name?: string;

  /**
   * @param {boolean} enabled
   * @param {Trigger} trigger
   * @param {Effect} effect
   */
  constructor(enabled: boolean, rules: Rule[], expression: any) {
    this.enabled = enabled;
    this.rules = rules;
    this.expression = expression;
  }

  setId(id: number) {
    this.id = id;
  }

  setName(name: string) {
    this.name = name;
  }


  /**
   * @return {RuleDescription}
   */
  toDescription() {
    const desc: RuleDescription = {
      enabled: this.enabled,
      rules: this.rules,
      expression: this.expression
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
  // stop() {
  //   this.trigger.removeListener(Events.STATE_CHANGED,
  //     this.onTriggerStateChanged);
  //   this.trigger.stop();
  //   if (DEBUG) {
  //     console.debug('Rule.stop', this.name);
  //   }
  // }

  /**
 * Create a rule from a serialized description
 * @param {RuleDescription} desc
 * @return {ComposedRule}
 */
  static fromDescription = function (desc: RuleDescription): ComposedRule {
    const expression = desc.expression
    const rules = desc.rules;
    const composedRule = new ComposedRule(desc.enabled, rules, expression);
    if (desc.hasOwnProperty('id')) {
      composedRule.id = desc.id;
    }
    if (desc.hasOwnProperty('name')) {
      composedRule.name = desc.name;
    }
    return composedRule;
  };

}


// module.exports = ComposedRule;
export default ComposedRule;
