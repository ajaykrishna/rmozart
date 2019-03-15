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
const Constants = require('./constants');
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
    this.ComposedRuleBlocks = [];
    this.conectors = {};
    // tittle bariables and the editin functionalities
    this.view = document.getElementById('rules-manager-view');
    this.ruleNameCustomize = this.view.querySelector('.rule-name-customize')
    this.ruleName = this.view.querySelector('.rule-name');

    const selectRuleName = () => {
      // Select all of ruleName, https://stackoverflow.com/questions/6139107/
      const range = document.createRange();
      range.selectNodeContents(this.ruleName);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    };

    this.ruleNameCustomize.addEventListener('click', selectRuleName);
    this.ruleName.addEventListener('dblclick', (event) => {
      event.preventDefault();
      selectRuleName();
    });
    
    this.ruleName.contentEditable = true;
    this.ruleName.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.ruleName.blur();
      }
    });

    this.ruleName.addEventListener('blur', () => {
      this.cRule.name = this.ruleName.textContent;
      this.cRule.update();
      this.onPresentationChange();
    });

// connector buttons
    this.conectors["after"] = document.getElementById("part-after");
    this.conectors["after"].addEventListener('mousedown', (event)=>this.onConectorBlockDown(event,"THEN"));
    this.conectors["and"] = document.getElementById("part-and");
    this.conectors["and"].addEventListener('mousedown', (event)=>this.onConectorBlockDown(event,"AND"));
    this.conectors["or"] = document.getElementById("part-or");
    this.conectors["or"].addEventListener('mousedown', (event)=>this.onConectorBlockDown(event,"OR"));
    this.conectors["group"] = document.getElementById("part-other");
    this.conectors["group"].addEventListener('mousedown', (event)=>this.onConectorBlockDown(event,"group"));

    this.nextId = 0;

    this.testButton.addEventListener('click',()=>{
      this.testCompile();
    });
    this.createRuleButton.addEventListener('click', () => {
      page('/rules/new');
    });
  },
  testCompile:function(){
     
      //  console.log(block instanceof VscadRulePropertyBlock)  
      
      var longest = ""
      // we do the loop backwards to avoid problems with splice
      for (let i = this.ComposedRuleBlocks.length-1; i >= 0; i--) {
        const block = this.ComposedRuleBlocks[i];
        if(block && block.role !== "removed"){
          //  expresion += block.text;  
          if(longest.length < block.getText().length)
            longest = block.getText();
        } 
      }
      this.cRule.setExpression(longest);
      this.cRule.setRules(this.cRule.getRulesFromExpression());
      
      // faltan las rules
      console.log(this.cRule.toDescription());
      

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
    newBlock.text = Constants.COMMANDS[type];
    newBlock.snapToGrid(x, y);
    newBlock.vscadDraggable.onDown(event);
    this.ComposedRuleBlocks.push(newBlock);
  },
 
  show: function(composedRuleId) {
    document.getElementById('speech-wrapper').classList.remove('assistant');
    this.gateway.readThings().then(() => {
      return this.readRules();
    });

    let rulePromise = Promise.resolve(null);
    if (composedRuleId !== 'new') {
      rulePromise = fetch(`/composed-rules/${encodeURIComponent(composedRuleId)}`, {
        headers: API.headers(),
      }).then((res) => {
        return res.json();
      });
    }
    rulePromise.then((ruleDesc)=>{
      this.cRule = new VscadCompsedRule(this.gateway,ruleDesc);
      this.cRule.update();
      this.prepareVisual(ruleDesc);
    });

    

  },
  prepareVisual: function(desc){
    this.ruleName.textContent = desc.name;

  },
  onDeviceBlockDown: function(event,desc,gateway) {

    const deviceRect = event.target.getBoundingClientRect();

    const x = deviceRect.left;
    const y = deviceRect.top;
    const newBlock = new VscadRulePropertyBlock(
      this.ruleArea,desc,gateway);
    newBlock.text = desc.id;
    newBlock.snapToGrid(x, y);
    newBlock.vscadDraggable.onDown(event);
    
   
    
    this.ComposedRuleBlocks.push(newBlock);
  },




};

module.exports = VscadRulesScreen;
