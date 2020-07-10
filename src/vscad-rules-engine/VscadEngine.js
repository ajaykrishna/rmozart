/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */


const Database = require('./VscadDatabase');
const Rule = require('./VscadComposedRule');


/**
 * An engine for running and managing list of rules
 */
class VscadEngine {
  /**
   * Get a list of all current rules
   * @return {Promise<Array<Rule>>} rules
   */
  getThings() {
    return Database.getThings();
  }

  /**
   * Get history from data base
   * @return {Promise<*[]>}
   */
  getHisotry() {
    return Database.getHistory();
  }

  getRules() {
    let rulesPromise = Promise.resolve(this.rules);
    // TODO  get the atual rules so we can activate the next
    if (!this.rules) {
      rulesPromise = Database.getRules().then(async (ruleDescs) => {
        this.rules = {};
        for (const ruleId in ruleDescs) {
          ruleDescs[ruleId].id = parseInt(ruleId);
          this.rules[ruleId] = Rule.fromDescription(ruleDescs[ruleId]);
        }
        return this.rules;
      });
    }

    return rulesPromise.then((rules) => {
      return Object.keys(rules).map((ruleId) => {
        return rules[ruleId];
      });
    });
  }

  /**
   * Get a rule by id
   * @param {number} id
   * @return {Promise<Rule>}
   */
  getRule(id) {
    const rule = this.rules[id];
    if (!rule) {
      return Promise.reject(new Error(`Rule ${id} does not exist`));
    }
    return Promise.resolve(rule);
  }

  /**
   * Add a new rule to the engine's list
   * @param {Rule} rule
   * @return {Promise<number>} rule id
   */
  async addRule(rule) {
    const id = await Database.createRule(rule.toDescription());
    rule.id = id;
    this.rules[id] = rule;
    return id;
  }

  /**
   * Update an existing rule
   * @param {number} rule id
   * @param {Rule} rule
   * @return {Promise}
   */
  async updateRule(ruleId, rule) {
    if (!this.rules[ruleId]) {
      return Promise.reject(new Error(`Rule ${ruleId} does not exist`));
    }
    rule.id = ruleId;
    await Database.updateRule(ruleId, rule.toDescription());
    this.rules[ruleId] = rule;
  }

  /**
   * Delete an existing rule
   * @param {number} rule id
   * @return {Promise}
   */
  deleteRule(ruleId) {
    if (!this.rules[ruleId]) {
      return Promise.reject(
        new Error(`Rule ${ruleId} already does not exist`));
    }
    return Database.deleteRule(ruleId).then(() => {
      delete this.rules[ruleId];
    });
  }

  /**
   * Create history
   * @param {String} composition
   */
  async createHistory(composition) {
    await Database.createHistory(composition);
    return 'is working';
  }

}

module.exports = VscadEngine;
