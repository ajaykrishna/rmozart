/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

const PromiseRouter = require('express-promise-router');

const APIError = require('../rules-engine/APIError');
const Database = require('./VscadDatabase');
const VscadEngine = require('./VscadEngine');
const Rule = require('./VscadComposedRule');

const index = PromiseRouter();
const engine = new VscadEngine();

/**
 * Express middleware for extracting rules from the bodies of requests
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {Function} next
 */
function parseRuleFromBody(req, res, next) {
 
  let rule = null;
  try {
    rule = Rule.fromDescription(req.body);
  } catch (e) {
    res.status(400).send(new APIError('Invalid rule', e).toString());
    return;
  }
  req.rule = rule;
  next();
}

index.get('/', async function(req, res) {
  const rules = await engine.getRules();
  res.send(rules.map((rule) => {
    return rule.toDescription();
  }));
});


index.get('/:id', async function(req, res) {
  try {
    const id = parseInt(req.params.id);
    const rule = await engine.getRule(id);
    res.send(rule.toDescription());
  } catch (e) {
    res.status(404).send(
      new APIError('Engine failed to get  composed rule', e).toString());
  }
});


index.post('/', parseRuleFromBody, async function(req, res) {
  const ruleId = await engine.addRule(req.rule);
  res.send({id: ruleId});
});

index.put('/:id', parseRuleFromBody, async function(req, res) {
  try {
    await engine.updateRule(parseInt(req.params.id), req.rule);
    res.send({});
  } catch (e) {
    res.status(404).send(
      new APIError('Engine failed to update rule', e).toString());
  }
});

index.delete('/:id', async function(req, res) {
  try {
    await engine.deleteRule(req.params.id);
    res.send({});
  } catch (e) {
    res.status(404).send(
      new APIError('Engine failed to delete rule', e).toString());
  }
});
index.get('/deploy/:id', async function(req, res) {
  try {
    console.log("exe");
    
    const masterEngine = require('./VscadMasterEngine').default;
    const id = parseInt(req.params.id);
    if(isNaN(id)){
      const masterEngine = require('./VscadMasterEngine').default;
    masterEngine.printPointers();
    res.send({});
    }else{
      const rule = await engine.getRule(id);
      masterEngine.execute(rule);
      res.send(rule.toDescription());
    }
   
  } catch (e) {
    res.status(404).send(
      new APIError('Engine failed', e).toString());
  }
});
index.get('/deploy/ask', async function(req, res) {
  try {
    
    
    
  } catch (e) {
    res.status(404).send(
      new APIError('Engine failed', e).toString());
  }
});

index.configure = async function() {
  await Database.open();
  await engine.getRules();
  
  const masterEngine = require('./VscadMasterEngine').default;
  const rule = await engine.getRule(1);
  masterEngine.execute(rule);
  
};

module.exports = index;
