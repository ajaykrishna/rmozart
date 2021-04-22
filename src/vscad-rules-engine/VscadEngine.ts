/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */


import Database from './VscadDatabase';
import Rule from './VscadComposedRule';


/**
 * An engine for running and managing list of rules
 */
class VscadEngine {

  private rules: Record<string, Rule> | null;

  constructor() {
    this.rules = null;
  }

  /**
   * Get a list of all current rules
   * @return {Promise<Array<Rule>>} rules
   */
  getThings(): Promise<unknown[]>{
    return Database.getThings();
  }
  
  /**
   * Get a list of all current rules
   * @return {Promise<Array<Rule>>} rules
   */
  getRules(): Promise<Rule[]> {
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
      return Object.keys(<object>rules).map((ruleId: string) => {
        return rules![ruleId];
      });
    });
  }

  /**
   * Get a rule by id
   * @param {number} id
   * @return {Promise<Rule>}
   */
  getRule(id: number) {
    if (!(id in this.rules!)) {
      return Promise.reject(new Error(`Rule ${id} does not exist`));
    }
    const rule = this.rules![id];
    return Promise.resolve(rule);
  }

  /**
   * Add a new rule to the engine's list
   * @param {Rule} rule
   * @return {Promise<number>} rule id
   */
  async addRule(rule: Rule): Promise<number>  {
    const id = await Database.createRule(rule.toDescription());
    rule.setId(id);
    this.rules![id] = rule;
    return id;
  }

  /**
   * Update an existing rule
   * @param {number} rule id
   * @param {Rule} rule
   * @return {Promise}
   */
  async updateRule(ruleId:  number, rule: Rule): Promise<void>  {
    if (!(ruleId in this.rules!)) {
      return Promise.reject(new Error(`Rule ${ruleId} does not exist`));
    }
    // rule.setId(ruleId);
    await Database.updateRule(ruleId, rule.toDescription());
    this.rules![ruleId] = rule;
  }

  /**
   * Delete an existing rule
   * @param {number} rule id
   * @return {Promise}
   */
  deleteRule(ruleId: number): Promise<void> {
    if (!(ruleId in this.rules!)) {
      return Promise.reject(new Error(`Rule ${ruleId} does not exist`));
    }
    return Database.deleteRule(ruleId).then(() => {
      delete this.rules![ruleId];
    });
  }

  /**
   * Get history from data base
   * @return {Promise<*[]>}
   */
  getHisotry() {
    return Database.getHistory();
  }

  /**
   * Create history
   * @param {String} composition
   */
  async createHistory(composition: any) {
    await Database.createHistory(composition);
    return 'is working';
  }

}

// module.exports = VscadEngine;
export default VscadEngine;
