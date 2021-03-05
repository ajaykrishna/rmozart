/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

import { RunResult } from 'sqlite3';
import db from '../db';
// import * as DatabaseMigrate from '../rules-engine/DatabaseMigrate';
import { RuleDescription } from './VscadComposedRule';

class VscadDatabase {
  constructor() {
    db.open();
    this.open();
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

  // /**
  //  * Get all rules
  //  * @return {Promise<Map<number, RuleDescription>>} resolves to a map of rule id
  //  * to rule
  //  */
  // getRules(): Promise<Record<number, RuleDescription>>  {
  //   const rules: Record<number, RuleDescription> = {};

  //   return new Promise((resolve, reject) => {
  //     db.all(
  //       'SELECT id, description FROM composedRules',
  //       [],
  //       (err: any, rows: any) => {
  //         if (err) {
  //           reject(err);
  //           return;
  //         }
  //         const updatePromises: any[] = [];
  //         for (const row of rows) {
  //           let desc = JSON.parse(row.description);
  //           rules[<number>row.id] = desc;
  //         }
  //         Promise.all(updatePromises).then(() => {
  //           resolve(rules);
  //         });
  //       }
  //     );
  //   });
  // };

  /**
   * Get all rules
   * @return {Promise<Map<number, RuleDescription>>} resolves to a map of rule
   * id to rule
   */
  getRules(): Promise<Record<number, RuleDescription>>  {
    const rules: Record<number, RuleDescription> = {};

    return db.all('SELECT id, description FROM rules').then((rows) => {
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

  getThings() {
    return new Promise((resolve, reject) => {
      db.all('SELECT id, description FROM things', [], (err: any, rows: any) => {
        if (err) {
          reject(err);
          return;
        }
        const things: any[] = [];
        const updatePromises: any[] = [];
        for (const row of rows) {
          let desc = JSON.parse(row.description);
          things[row.id] = desc;
        }
        Promise.all(updatePromises).then(() => {
          resolve(things);
        });
      });
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
}
// module.exports = new VscadDatabase();
export default new VscadDatabase();
