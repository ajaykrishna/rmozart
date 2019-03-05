/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

const API = require('./api');
const Gateway = require('./rules/Gateway');
const VscadRuleCardItem = require('./rules/VscadRuleCardItem');
const page = require('page');
const VscadRulePropertyBlock = require('./rules/VscadRulePropertyBlock');
'use strict';

// eslint-disable-next-line no-unused-vars
const VscadRulesScreen = {
  init: function() {
    this.createRuleButton = document.getElementById('create-rule-button');
    this.createRuleHint = document.getElementById('create-rule-hint');
    this.rulesList = document.getElementById('rules-side-menu');
    this.ruleArea = document.getElementById('rules-area');
    this.testButton = document.getElementById('test-button');
    this.gateway = new Gateway();
    this.nextId = 0;

    this.testButton.addEventListener('click',()=>{
      this.testApi();
    });
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
        this.addVscadRuleCardItem(ruleDesc);
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
  addVscadRuleCardItem: function(desc) {
    const ruleElt = document.createElement('div');
    ruleElt.classList.add('rule');
    try {
      new VscadRuleCardItem(this.gateway, ruleElt, this.nextId, desc);
    } catch (e) {
      console.error('Invalid rule', desc, e);
      this.nextId += 1;
      return;
    }
    ruleElt.addEventListener('mousedown',(event)=>{
      this.onDeviceBlockDown(event,desc,this.gateway).bind(this)
    }
      )
    this.nextId += 1;
    this.rulesList.appendChild(ruleElt);
  },

  show: function() {
    document.getElementById('speech-wrapper').classList.remove('assistant');

    this.gateway.readThings().then(() => {
      return this.readRules();
    });
  },
  onDeviceBlockDown: function(event,desc,gateway) {

    const deviceRect = event.target.getBoundingClientRect();

    const x = deviceRect.left;
    const y = deviceRect.top;
    const newBlock = new VscadRulePropertyBlock(
      this.ruleArea,desc,gateway);
    newBlock.snapToGrid(x, y);
    newBlock.draggable.onDown(event);
  },




};

module.exports = VscadRulesScreen;
