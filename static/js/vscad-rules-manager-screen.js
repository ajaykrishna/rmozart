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
const VscadCompsedRule = require('./rules/VscadComposedRule');
const VscadConectorBlock = require('./rules/VscadConectorBlock');
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
    this.conectors = {};

    this.conectors["after"] = document.getElementById("part-after");
    this.conectors["and"] = document.getElementById("part-and");
    this.conectors["or"] = document.getElementById("part-or");
    this.conectors["other"] = document.getElementById("part-other");
    
    for(var key in this.conectors){
     this.conectors[key].addEventListener('click', (event)=>{
        this.onConectorBlockDown(event,key);
      });
    }
    this.nextId = 0;

    this.testButton.addEventListener('click',()=>{
      this.testApi();
    });
    this.createRuleButton.addEventListener('click', () => {
      page('/rules/new');
    });
  },
 testApi:function testApi(){
   console.log("testing");
   //get all
   fetch('/composed-rules', {headers: API.headers()}).then((res) => {
    return res.json();
  }).then((fetchedRules) => {
    for (const ruleDesc of fetchedRules) {
      console.log(ruleDesc);
      
    }
  });
   const desc ={
    enabled:true,
    name : "Rule Name",
    rules : [],
    expresion :"[r1 ; r3 , r2] | r4"
   }
   // creation
    var cRule = new VscadCompsedRule(this.gateway,desc);

   cRule.expression ="2,4;8*10";
   cRule.update().then(()=>{
     // get
    fetch(`/composed-rules/${cRule.id}`, {
      headers: API.headers(),
    }).then((res) => {
      console.log(res.json);
      
      return res.json();
    });
  }); 
   
 
    
   //cRule.delete();

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
  onConectorBlockDown: function(event,type) {
    console.log(type);
    const deviceRect = event.target.getBoundingClientRect();

    const x = deviceRect.left;
    const y = deviceRect.top;
    const newBlock = new VscadConectorBlock(this.ruleArea,type);
    newBlock.snapToGrid(x, y);
    newBlock.draggable.onDown(event);
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
