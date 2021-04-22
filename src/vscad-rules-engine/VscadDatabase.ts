/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

import { RunResult } from 'sqlite3';
import db from '../db';
import { RuleDescription } from './VscadComposedRule';

class VscadDatabase {
  constructor() {
    db.open();
    this.open();
    this.open2();
  }

  /**
   * Open the database
   */
  open(): Promise<RunResult> {
    const rulesTableSQL = `CREATE TABLE IF NOT EXISTS composedRules (
    id INTEGER PRIMARY KEY,
    description TEXT
  );`;
    return db.run(rulesTableSQL);
  }

  /**
   * Get all rules
   * @return {Promise<Map<number, RuleDescription>>} resolves to a map of rule
   * id to rule
   */
  getRules(): Promise<Record<number, RuleDescription>>  {
    const rules: Record<number, RuleDescription> = {};

    return db.all('SELECT id, description FROM composedRules').then((rows) => {
      const updatePromises: any = [];
      for (const row of rows) {
        let desc = JSON.parse(<string>row.description);
        rules[<number>row.id] = desc;
      }

      Promise.all(updatePromises);
    })
    .then(()=> {
      return rules;
    });
  }

  getThings(): Promise<unknown[]>{
    return db.all('SELECT id, description FROM things').then((rows) => {
      const things = [];
      for (const row of rows) {
        const thing = JSON.parse(<string>row.description);
        thing.id = row.id;
        things.push(thing);
      }

      return things;
    });
  }

  /**
   * Create a new rule
   * @param {RuleDescription} desc
   * @return {Promise<number>} resolves to rule id
   */
  createRule(desc: RuleDescription): Promise<number> {
    console.log(JSON.stringify(desc));
    return db
      .run('INSERT INTO composedRules (description) VALUES (?)', JSON.stringify(desc))
      .then((res) => {
        return res.lastID;
      });
  }

  /**
   * Update an existing rule
   * @param {number} id
   * @param {RuleDescription} desc
   * @return {Promise}
   */
  updateRule(id: number, desc: RuleDescription): Promise<RunResult> {
    return db.run(
      'UPDATE composedRules SET description = ? WHERE id = ?',
      JSON.stringify(desc),
      id
    );
  }

  /**
   * Delete an existing rule
   * @param {number} id
   * @return {Promise}
   */
  deleteRule(id: number): Promise<RunResult> {
    return db.run('DELETE FROM composedRules WHERE id = ?', [id]);
  }

  open2(): Promise<RunResult> {
    const historyTable = 'CREATE TABLE IF NOT EXISTS composition_history (' +
      'id_history INTEGER PRIMARY KEY,' +
      'history TEXT,' +
      'dateExecution TIMESTAMP NOT NULL' +
      ');';
    return db.run(historyTable);
  };

  /**
   * Get all history rules
   * @return {Promise<Mapw<number, >>}
   */
  getHistory(): Promise<unknown[]> {

    return db.all('SELECT id_history, history, dateExecution FROM composition_history').then((rows) => {
      const history: any = {};
      const historydata = [];
      for (const row of rows) {
        history.id = row.id_history;
        history.history = row.history;
        history.date = row.dateExecution;
        historydata.push(history);
      }
      
      return historydata;
    });

  };

  /**
   * Create history
   * @param {String} history
   */
  createHistory(history: string) : Promise<RunResult>{
    return db.run(
      'INSERT INTO composition_history (history, dateExecution) VALUES (?, ?)',
      [history, Date()],
    );
  };
}
// module.exports = new VscadDatabase();
export default new VscadDatabase();
