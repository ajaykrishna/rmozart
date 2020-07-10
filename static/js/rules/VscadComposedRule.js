/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

const API = require('../api');

/* {
  "id": 1,
  "enabled":true,
  "name": "Rule Name",
  "rules": [],
  "expression":"[r1 ; r3 , r2] | r4"
}
*/

/**
 * Model of a Rule loaded from the Rules Engine
 * @constructor
 * @param {Gateway} gateway - The remote gateway to which to talk
 * @param {RuleDescription?} desc - Description of the rule to load
 * @param {Function?} onUpdate - Listener for when update is called
 */
function ComposedRule(gateway, desc, onUpdate) {
  this.gateway = gateway;
  this.onUpdate = onUpdate;

  if (desc) {
    this.id = desc.id;
    this.enabled = desc.enabled;
    if (desc.name) {
      this.name = desc.name;
    } else {
      this.name = 'Composed Rule';
    }
    this.rules = desc.rules;
    this.expression = desc.expression;
    this.expression2 = desc.expression;
  }
}
/**
 * Validate and save the rule
 * @return {Promise}
 */
ComposedRule.prototype.update = function() {
  if (this.onUpdate) {
    this.onUpdate();
  }
  const desc = this.toDescription();
  if (!desc) {
    return Promise.reject('invalid description');
  }

  const fetchOptions = {
    headers: API.headers(),
    method: 'PUT',
    body: JSON.stringify(desc),
  };
  fetchOptions.headers['Content-Type'] = 'application/json';
  //console.log("updating with body",desc);

  let request = null;
  if (typeof this.id !== 'undefined') {
    request = fetch(`/composed-rules/${encodeURIComponent(this.id)}`, fetchOptions);
  } else {
    fetchOptions.method = 'POST';
    request = fetch('/composed-rules/', fetchOptions).then((res) => {
      return res.json();
    }).then((rule) => {
      this.id = rule.id;
    });
  }
  return request;
};
ComposedRule.prototype.getRulesFromExpression = function(){
var output ={}
const results  = this.expression.match(/\d+/g)
if(results)
  results.forEach(function(e){
      output[e]=true
  })
  return Object.keys(output);
}
/**
 * Delete the rule
 * @return {Promise}
 */
ComposedRule.prototype.delete = function() {
  const fetchOptions = {
    headers: API.headers(),
    method: 'DELETE',
  };

  if (typeof this.id === 'undefined') {
    return;
  }

  return fetch(`/composed-rules/${encodeURIComponent(this.id)}`, fetchOptions);
};
/**
 * Convert this rule into a serialized description
 * @return {RuleDescription?} description or null if not a valid rule
 */
ComposedRule.prototype.toDescription = function() {
  return {
    enabled : true,
    id : this.id,
    name :  this.name,
    rules :  this.rules,
    expression: this.expression
  } ;
};
ComposedRule.prototype.getBpmnDescription = function(fetchedRules) {
  var description = this.toDescription();
  var rulesMap = {}
  fetchedRules.forEach(rule=>{
    if(description.rules.indexOf(""+rule.id) !== -1){
      rulesMap[rule.name] = rule.id;
    }
  })
  description.mapedRules = rulesMap ;
  console.log(description);

  return  description;
};
/**
 * Set the  rules used in the composed rule, updating the server model if valid
 * @return {Promise}
 */
ComposedRule.prototype.setRules = function(rules) {
  this.rules = rules;
  return this.update();
};
/**
 * Set the expression of the  composed Rule, updating the server model if valid
 * @return {Promise}
 */
ComposedRule.prototype.setExpression = function(expression) {
  this.expression = expression;
  return this.update();
};
ComposedRule.prototype.setExpression2 = function(expression) {
  this.expression = expression;
};
ComposedRule.prototype.getExpression = function() {
  return this.expression;
}

module.exports = ComposedRule;
