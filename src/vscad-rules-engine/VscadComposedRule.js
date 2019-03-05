/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */
const effects = require('../rules-engine/effects');
const triggers = require('../rules-engine/triggers');
const Events = require('../rules-engine/Events');

const DEBUG = false || (process.env.NODE_ENV === 'test');

class ComposedRule {
  /**
   * @param {boolean} enabled
   * @param {Trigger} trigger
   * @param {Effect} effect
   */
  constructor(enabled, trigger, effect) {
    this.enabled = enabled;
    this.trigger = trigger;
    this.effect = effect;

    this.onTriggerStateChanged = this.onTriggerStateChanged.bind(this);
  }

  /**
   * Begin executing the ComposedRule
   */
  async start() {
    this.trigger.on(Events.STATE_CHANGED, this.onTriggerStateChanged);
    await this.trigger.start();
    if (DEBUG) {
      console.debug('Rule.start', this.name);
    }
  }

  /**
   * On a state changed event, pass the state forward to the rule's effect
   * @param {State} state
   */
  onTriggerStateChanged(state) {
    if (!this.enabled) {
      return;
    }
    if (DEBUG) {
      console.debug('Rule.onTriggerStateChanged', this.name, state);
    }
    this.effect.setState(state);
  }

  /**
   * @return {RuleDescription}
   */
  toDescription() {
    const desc = {
      enabled: this.enabled,
      trigger: this.trigger.toDescription(),
      effect: this.effect.toDescription(),
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
  const trigger = triggers.fromDescription(desc.trigger);
  const effect = effects.fromDescription(desc.effect);
  const composedRule = new ComposedRule(desc.enabled, trigger, effect);
  if (desc.hasOwnProperty('id')) {
    composedRule.id = desc.id;
  }
  if (desc.hasOwnProperty('name')) {
    composedRule.name = desc.name;
  }
  return composedRule;
};

module.exports = ComposedRule;
