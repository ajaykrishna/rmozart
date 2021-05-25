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
  constructor( enabled: boolean, rules: Rule[], expression: any) {
    this.enabled = enabled;
    this.rules = rules;
    this.expression = expression;
  }


  setName(name: string): void {
    this.name = name;
  }

  setId(id: number): void {
    this.id = id;
  }

  setExpression(expression: any): void {
    this.expression = expression;
  }

  setRules(rules: any): void  {
      this.rules = rules;
  }

  setEnabled(enable: boolean): void {
    this.enabled = enable;
  }

  getId(): number {
    return this.id!;
  }

  getName(): string {
    return this.name!;
  }

  getExpressions(): any {
    return this.expression;
  }

  isEnabled(): boolean {
    return this.enabled;
  }


  /**
   * @return {RuleDescription}
   */
  toDescription(): RuleDescription {
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
    // const id = desc.id;
    const expression = desc.expression
    const rules = desc.rules;
    const enabled = desc.enabled;
    // const name = desc.name;
    const composedRule = new ComposedRule(enabled, rules, expression);
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
