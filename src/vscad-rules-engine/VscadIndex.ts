/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

import PromiseRouter from 'express-promise-router';
import express from 'express';

import APIError from '../rules-engine/APIError';
import Database from './VscadDatabase';
import VscadEngine from './VscadEngine';
import Rule from './VscadComposedRule';


class Vscadindex {
  private index: express.Router;
  private engine: VscadEngine;

  constructor() {
    this.index = PromiseRouter();
    this.engine = new VscadEngine();

    /**
     * Express middleware for extracting rules from the bodies of requests
     * @param {express.Request} req
     * @param {express.Response} res
     * @param {Function} next
     */
    function parseRuleFromBody(req: any, res: any, next: any) {

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

    this.index.get('/', async  (_req, res) => {
      const rules = await this.engine.getRules();
      res.send(rules.map((rule) => {
        return rule.toDescription();
      }));
    });

    this.index.get('/things', async  (_req, res) => {
      const things = await this.engine.getThings();
      res.send(things);
    });


    this.index.get('/:id', async  (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const rule = await this.engine.getRule(id);
        res.send(rule.toDescription());
      } catch (e) {
        res.status(404).send(
          new APIError('Engine failed to get  composed rule', e).toString());
      }
    });


    this.index.post('/', parseRuleFromBody, async  (req: any, res: any) => {
      const ruleId = await this.engine.addRule(req.rule);
      res.send({ id: ruleId });
    });

    this.index.put('/:id', parseRuleFromBody, async  (req: any, res: any) => {
      try {
        await this.engine.updateRule(parseInt(req.params.id), req.rule);
        res.send({});
      } catch (e) {
        res.status(404).send(
          new APIError('Engine failed to update rule', e).toString());
      }
    });

    this.index.delete('/:id', async  (req: any, res: any) => {
      try {
        await this.engine.deleteRule(req.params.id);
        res.send({});
      } catch (e) {
        res.status(404).send(
          new APIError('Engine failed to delete rule', e).toString());
      }
    });

    this.index.get('/deploy/:id', async  (req: any, res: any) => {
      try {

        const masterEngine = require('./VscadMasterEngine').default;
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          const masterEngine = require('./VscadMasterEngine').default;
          masterEngine.printPointers();
          res.send({});
        } else {
          const rule = await this.engine.getRule(id);
          masterEngine.execute(rule);
          //res.send(rule.toDescription());
          res.send({ "msg": "si cambia" })
        }

      } catch (e) {
        res.status(404).send(
          new APIError('Engine failed', e).toString());
      }
    });
  }

  async configure(): Promise<void> {
    await Database.open();
    await this.engine.getRules();
    try {
      const masterEngine = require('./VscadMasterEngine').default;
      const rule = await this.engine.getRule(1);
      masterEngine.execute(rule);
    } catch (e) {
      new APIError('Engine failed to get  composed rule you sould create', e).toString();
    }

  }

  getController(): express.Router {
    return this.index;
  }
}

// module.exports = index;
export default new Vscadindex();
