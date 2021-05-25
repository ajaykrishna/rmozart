/**
 * Json Model.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

"use strict";

const API = require("../api").default;
const App = require("../app");
const Model = require("./model");
const Constants = require("../constants");

class JsonModel {
  constructor() {}

  getJsonCompareNew(expression, description) {
    new Promise((resolve) => {
      const rules = [];
      const formatJson = {};
      let cant = 0;

      fetch("/rules", { headers: API.headers() })
        .then((res) => {
          return res.json();
        })
        .then((fetchedRules) => {
          for (const ruleDesc of fetchedRules) {
            if (description.rules.includes(String(ruleDesc.id))) {
              rules.push(ruleDesc);
              cant += 1;
            }
          }
        })
        .finally(async () => {
          formatJson.Rules = [];
          formatJson.Exp = expression;
          formatJson.Rule = [];
          for (let index = 0; index < cant; index++) {
            formatJson.Rules.push(rules[index].name);
            const id = rules[index].id;
            formatJson.Rule[id] = {};
            formatJson.Rule[id].triggers = {};
            formatJson.Rule[id].triggers.operator = rules[index].trigger.op;
            formatJson.Rule[id].effects = {};
            formatJson.Rule[id].triggers.objets = [];
            formatJson.Rule[id].effects.objets = [];
            for (const data of rules[index].trigger.triggers) {
              await API.getJson(
                `/things/${data.property.thing}/properties`
              ).then((data2) => {
                const info = {};
                info.objetId = data.property.thing;
                info.state = data2;
                formatJson.Rule[id].triggers.objets.push(info);
              });
            }
            for (const data of rules[index].effect.effects) {
              await API.getJson(
                `/things/${data.property.thing}/properties`
              ).then((data2) => {
                const info2 = {};
                info2.objetId = data.property.thing;
                info2.state = data2;
                formatJson.Rule[id].effects.objets.push(info2);
              });
            }
          }
          resolve(formatJson);
        });
    });
  }

  getOldJsonCompare(rulesJ, expressionJ) {
    return new Promise((resolve) => {
      let rules = [];
      const formatJson = {};
      let cant = 0;
      const ids = rulesJ;
      const expression = expressionJ;
      rules = [];
      fetch("/rules", { headers: API.headers() })
        .then((res) => {
          return res.json();
        })
        .then((fetchedRules) => {
          for (const ruleDesc of fetchedRules) {
            if (ids.includes(String(ruleDesc.id))) {
              rules.push(ruleDesc);
            }
          }
        })
        .finally(async () => {
          formatJson.Rules = [];
          formatJson.Exp = expressionJ;
          formatJson.Rule = {};
          for (let index = 0; index < cant; index++) {
            formatJson.Rules.push(rules[index].name);
            const id = rules[index].id;
            formatJson.Rule[id] = {};
            formatJson.Rule[id].triggers = {};
            formatJson.Rule[id].triggers.operator = rules[index].trigger.op;
            formatJson.Rule[id].effects = {};
            formatJson.Rule[id].effects = {};
            formatJson.Rule[id].triggers.objets = [];
            formatJson.Rule[id].effects.objets = [];
            for (const data of rules[index].trigger.triggers) {
              const info = {};
              info.objetId = data.property.thing;
              formatJson.Rule[id].triggers.objets.push(info);
            }
            for (const data of rules[index].effect.effects) {
              const info2 = {};
              info2.objetId = data.property.thing;
              formatJson.Rule[id].effects.objets.push(info2);
            }
          }
          resolve(formatJson);
        });
    });
  }
}

module.exports = JsonModel;
