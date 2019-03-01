/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

const API = require('./api');
const Gateway = require('./rules/Gateway');
const RuleCardItem = require('./rules/RuleCardItem');
const page = require('page');

const RulePropertyBlock = require('./rules/RulePropertyBlock');

'use strict';

// eslint-disable-next-line no-unused-vars
const RulesScreen = {
  init: function() {
    this.createRuleButton = document.getElementById('create-rule-button');
    this.createRuleHint = document.getElementById('create-rule-hint');
    this.rulesList = document.getElementById('rules-side-menu');
    this.ruleArea = document.getElementById('rules-area');
    this.gateway = new Gateway();
    this.nextId = 0;

    this.createRuleButton.addEventListener('click', () => {
      page('/rules/new');
    });
  },

  /**
   * @return {Promise<Array<RuleDescription>>}
   */
  readRules: function readRules() {
    return fetch('/rules', {headers: API.headers()}).then((res) => {
      return res.json();
    }).then((fetchedRules) => {
      this.rulesList.querySelectorAll('.rule').forEach((elt) => {
        elt.parentNode.removeChild(elt);
      });

      for (const ruleDesc of fetchedRules) {
        console.log("CARGANDO REGLA ");
        
        this.addRuleCardItem(ruleDesc);
      }

      if (fetchedRules.length === 0) {
        this.createRuleHint.classList.remove('hidden');
      } else {
        this.createRuleHint.classList.add('hidden');
      }
    });
  },
  /**
   * Add a rule, filling it with the data from a RuleDescription
   * @param {RuleDescription} desc
   */
  addRuleCardItem: function(desc) {
    const ruleElt = document.createElement('div');
    ruleElt.classList.add('rule');
    try {
      new RuleCardItem(this.gateway, ruleElt, this.nextId, desc);
    } catch (e) {
      console.error('Invalid rule', desc, e);
      this.nextId += 1;
      return;
    }
    ruleElt.addEventListener('mousedown',this.onDeviceBlockDown.bind(this))
    this.nextId += 1;
    this.rulesList.appendChild(ruleElt);
  },

  show: function() {
    document.getElementById('speech-wrapper').classList.remove('assistant');

    this.gateway.readThings().then(() => {
      return this.readRules();
    });
  },
  onDeviceBlockDown: function(event) {

    const deviceRect = event.target.getBoundingClientRect();

    const x = deviceRect.left;
    const y = deviceRect.top;
    const newBlock = new RulePropertyBlock(
      this.ruleArea);
    newBlock.snapToGrid(x, y);
    newBlock.draggable.onDown(event);
    this.partBlocks.push(newBlock);
  },




};

module.exports = RulesScreen;
