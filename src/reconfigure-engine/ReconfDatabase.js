/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

const db = require('../db.js');

function ReconfDatabase() {
  if (!db.db) {
    db.open();
  }
  this.open();
}

/**
 *  Open the data base ...
 **/
ReconfDatabase.prototype.open = function() {
  const historyTable = 'CREATE TABLE IF NOT EXISTS composition_history (' +
    'id_history INTEGER PRIMARY KEY,' +
    'history TEXT' +
    ');';
  return db.run(historyTable, []);
};

/**
 * Create history
 * @param {String} history
 */
ReconfDatabase.prototype.createHistory = function(history) {
  return db.run(
    'INSERT INTO composition_history (history) VALUES (?)',
    [history],
  );
};

module.exports = new ReconfDatabase();


