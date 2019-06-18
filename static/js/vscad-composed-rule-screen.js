/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

const API = require('./api');
const BpmnJS = require('bpmn-js').default;
const Gateway = require('./rules/Gateway');
const VscadRuleCardItem = require('./rules/VscadRuleCardItem');
const page = require('page');
const VscadRulePropertyBlock = require('./rules/VscadRulePropertyBlock');
const VscadComposedRule = require('./rules/VscadComposedRule');
const VscadConnectorBlock = require('./rules/VscadConnectorBlock');


'use strict';

// eslint-disable-next-line no-unused-vars
const VscadRulesScreen = {
  init: function() {
    this.rulesList = document.getElementById('rules-side-menu');
    this.ruleArea = document.getElementById('rules-area');
    this.testButton = document.getElementById('test-button');
    this.diagramView = document.getElementById('diagram-view');
    this.loader = document.getElementById('loader-holder')
    this.diagramButton = document.getElementById('diagram-button');
    this.verificationButton = document.getElementById('verification-button');
    this.saveButton = document.getElementById('save-button');
    this.deployButton = document.getElementById('deploy-button');

    this.saveRule = this.saveRule.bind(this);
    
    this.gateway = new Gateway();
    this.ComposedRuleBlocks = [];
    this.connectors = {};
    this.diagramLoaded = false;
    this.loaders= 0;
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
    
    this.diagramView.addEventListener('click',()=>{
      this.diagramView.classList.remove('selected');
      this.diagramView.style.display = "none"
      this.hiddeVerification();
      this.hiddeDiagram();
    })

    this.testButton.addEventListener('click',()=>{
     
      fetch('/composed-rules/deploy/ask',{headers: API.headers()}).then((res)=>{
        console.log(res);
      });
    })

    this.deployButton.addEventListener('click', (event) => {
      this.deployRule()
    });
    this.verificationButton.addEventListener('click',()=>{
      this.requestVerify();
    })
    this.diagramButton.addEventListener('click',()=>{
      this.requestDiagram();
    });
    this.saveButton.addEventListener('click',()=>{
      this.saveRule();
    });
  
    
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
    this.connectors["after"] = document.getElementById("part-after");
    this.connectors["after"].addEventListener('mousedown', (event)=>this.onconnectorBlockDown(event,"THEN"));
    this.connectors["and"] = document.getElementById("part-and");
    this.connectors["and"].addEventListener('mousedown', (event)=>this.onconnectorBlockDown(event,"AND"));
    this.connectors["or"] = document.getElementById("part-or");
    this.connectors["or"].addEventListener('mousedown', (event)=>this.onconnectorBlockDown(event,"OR"));
    this.connectors["group"] = document.getElementById("part-other");
    this.connectors["group"].addEventListener('mousedown', (event)=>this.onconnectorBlockDown(event,"group"));

    this.nextId = 0;

   
  },
 showLoader(){
   this.loaders ++;
   this.loader.style.display = "block";
 },
 hiddeLoader(){
   this.loaders --;
   if(this.loaders <=0){
    this.loader.style.display = "none";
    this.loaders = 0;
   }
  
 },
  showVerification:function(response){
    this.diagramView.classList.add('selected');
    this.diagramView.style.display = "flex";
    this.hiddeDiagram();
    
   var  alertDialog = document.getElementById('validation-dialog');
    alertDialog.style.display = "block"
    if(response.status){
      alertDialog.querySelector("#tittle").textContent = "Verified";
      alertDialog.querySelector("img").src = "../images/tick-mark.png"
    }
    else{
      alertDialog.querySelector("#tittle").textContent = "Problem found";
      alertDialog.querySelector("img").src = "../images/rejected-mark.png"
    }
    alertDialog.querySelector("#noti-message").textContent = response.message;
     
  },
  hiddeVerification:function(){
   var alertDialog = document.getElementById('validation-dialog');
    alertDialog.style.display = "none";
  },
  hiddeDiagram(){
    var  diagram = document.getElementById('canvas');
    diagram.style.display = "none"
  },
  showDiagram:function (bpmnXML){
    var  diagram = document.getElementById('canvas');
    diagram.style.display = "flex"
    this.diagramView.classList.add('selected');
    this.diagramView.style.display = "flex";
    this.hiddeVerification()
    if(this.diagramLoaded)
      this.bpmnViewer.clear();
     else{
      this.bpmnViewer = new BpmnJS({
        container: '#canvas'
      });
     } 
      // import diagram
      this.bpmnViewer.importXML(bpmnXML,(err) => {
      if (err)  return console.error('could not import BPMN 2.0 diagram', err);
      // access viewer components
      var canvas = this.bpmnViewer.get('canvas');
      // zoom to fit full viewport
      canvas.zoom('fit-viewport');
  
    });
    this.diagramLoaded = true;
  },
   
  requestDiagram:function(){
    const fetchOptions = 
      {
        method: "POST", 
        cache: "no-cache",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/xml",    
        },
        redirect: "follow", 
        referrer: "no-referrer",
        body: JSON.stringify(this.cRule.toDescription()),
      }
      //10.138.2.9:8080
      this.showLoader()
    fetch('http://localhost:9001/workflow', fetchOptions).then((res)=>{
      //console.log(res);
      res.text().then(text =>{
        this.hiddeLoader();
        this.showDiagram(text);
      })
    
    });
    // ;
  },
  requestExecution:function(){
    this.showLoader();
    fetch('/composed-rules/deploy/1',{headers: API.headers()}).finally(()=>{
      this.hiddeLoader();
    })
  },
     
  requestVerify:function(cRule){
   
    fetch(`/rules`, {headers: API.headers(),}).then((res) => {
      return res.json();
    }).then((res) => {
      this.showLoader();
      var info = {}
      info.expression = this.cRule.expression;
      info.objects = [];
      info.rules = [];

      var usedRules = [];
      var usedObjects = {};
      //get te used rules
      res.forEach(rule => {
         if(this.cRule.rules.includes(`${rule.id}`))
          usedRules.push(rule);
      });
      // 
      usedRules.forEach(rule => {
        var tempRule = {}
        tempRule.id =  rule.id.toString();
        tempRule.type = rule.trigger.op;
        tempRule.events = []
        tempRule.actions = []
        rule.trigger.triggers.forEach(trigger => {
          if(trigger.property){
            tempRule.actions.push(`${trigger.property.thing}|${trigger.property.id}`)
            usedObjects[trigger.property.thing] = true;
          }else{ 
            tempRule.actions.push(`${trigger.type}|${Object.keys(trigger)[1]}`)
            usedObjects[trigger.type] = true;
          }
        });
        rule.effect.effects.forEach(effect => {
          if(effect.property){
            tempRule.events.push(`${effect.property.thing}|${effect.property.id}`)
            usedObjects[effect.property.thing] = true;
          }else{
            tempRule.events.push(`${effect.type}|${Object.keys(effect)[1]}`)
            usedObjects[effect.type] = true;
          }
         
        });
        info.rules.push(tempRule);
     });

     info.objects = Object.keys(usedObjects);
      //console.log('final info ', info);
     return info;

    }).then((info)=>{
      const fetchOptions = 
      {
        method: "POST",
        mode: 'cors',
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        redirect: "follow", 
        referrer: "no-referrer", 
        body: JSON.stringify(info),
    }
    fetch('http://localhost:9001/verify', fetchOptions).then((res)=>{
       return res.json()
     }).then( data =>{
      this.showVerification(data);
      this.hiddeLoader();
     })
    });
    
  },
    saveRule:function(){
      var longest = ""
      var   foundRules = 0;
      for (let i = this.ComposedRuleBlocks.length-1; i >= 0; i--) {
        const block = this.ComposedRuleBlocks[i];
        if(block && block.role === ""){
          if(longest.length < block.getText().length)
            longest = block.getText();
            foundRules++
        } 
        else if(block.role === "removed")
          this.ComposedRuleBlocks.splice(i,1)
        
      }
      //console.log(this.ComposedRuleBlocks);
    
        document.getElementById('warning-message').style.display = (foundRules>1)?"block":"none"
     
      this.cRule.setExpression(longest);
      this.cRule.setRules(this.cRule.getRulesFromExpression());
      
      // faltan las rules
      //console.log(this.cRule.toDescription());
      

  },
  deployRule(){
    this.requestExecution();
  },
 

  /**
   * @return {Promise<Array<RuleDescription>>}
   */
  readRules: function readRules() {
    var createRuleButton = document.createElement("div")
    createRuleButton.innerHTML = ` <div class="rule-part-block trigger">
    <img  src="/optimized-images/add.svg">
  </div>
  <div class="rule-info">
      <h3>NEW RULE</h3>
  </div>`;
    createRuleButton.setAttribute("id","create-rule-shortcut")
    createRuleButton.setAttribute("class","rule")

  createRuleButton.addEventListener('click',()=>{
    page("/rules/quickNew");
  })
    
    this.showLoader()
    return fetch('/rules', {headers: API.headers()}).then((res) => {
      return res.json();
    }).then((fetchedRules) => {
      this.rulesList.querySelectorAll('.rule').forEach((elt) => {
        elt.parentNode.removeChild(elt);
      });
      this.rulesList.appendChild(createRuleButton)
      for (const ruleDesc of fetchedRules) {
        this.addVscadRuleCardItem(ruleDesc);
      }

      this.fetchedRules = fetchedRules;
      if(this.ComposedRuleBlocks.length<=0)
        this.prepareVisual(this.cRule.toDescription(),this.gateway,this.fetchedRules);
    }).finally(()=>{
      this.hiddeLoader();
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
      this.onDeviceBlockDown(event,desc,this.gateway);
    }
      )
    this.nextId += 1;
    this.rulesList.appendChild(ruleElt);
  },
  onconnectorBlockDown: function(event,type) {
    const deviceRect = event.target.getBoundingClientRect();
    const x = deviceRect.left;
    const y = deviceRect.top;
    const newBlock = new VscadConnectorBlock(this.ruleArea,this.saveRule,type);
    newBlock.snapToGrid(x, y);
    newBlock.vscadDraggable.onDown(event);
    this.ComposedRuleBlocks.push(newBlock);
  },
 
  show: function(composedRuleId) {
    document.getElementById('speech-wrapper').classList.remove('assistant');
    this.gateway.readThings().then(() => {
      return this.readRules();
    })

    let rulePromise = Promise.resolve(null);
    if (composedRuleId !== 'new') {
      rulePromise = fetch(`/composed-rules/${encodeURIComponent(composedRuleId)}`, {
        headers: API.headers(),
      }).then((res) => {
        return res.json();
      });
    }
    rulePromise.then((ruleDesc)=>{
      if(this.ComposedRuleBlocks.length<=0){
      this.cRule = new VscadComposedRule(this.gateway,ruleDesc);
      this.cRule.update();
      this.prepareVisual(this.cRule.toDescription(),this.gateway,this.fetchedRules);
      }
    });


  },
  prepareVisual: function(desc,gateway,fetchedRules){
    if(desc.expression && gateway && fetchedRules){
      var usedRules = {};
      // get all the used rules 
      for (var ruleDesc of fetchedRules) {
        if(desc.rules.includes(String(ruleDesc.id))){
         usedRules[String(ruleDesc.id)] = ruleDesc;
        }
      }
      
      var parts = desc.expression.split(" ")
       var newBlock = this.getBlockOf(parts.slice(1,parts.length-1), usedRules);
      this.ComposedRuleBlocks.push(newBlock);
       newBlock.snapToGrid(20,20)
         
      // sets the name on the titel
       this.ruleName.textContent = desc.name;
     
    }
    },
    getBlockOf: function(parts, usedRules){
      
      var i = 0;
      const block = new VscadConnectorBlock(this.ruleArea,this.saveRule)
      while(i<parts.length){
        var part = parts[i];
        if(part == "("){
          var j = i+1;
          var count =1;
         while(  count >= 1 && j<parts.length){
           if(parts[j] == ")") count--;
           if(parts[j] == "(") count ++;
          j++;
         } 

         block.addAsChild(this.getBlockOf(parts.slice(i+1,j),usedRules));
         i = j;
        }
        else if(isNaN(Number(part))){
          if(!block.name)
            switch (part) {
              case ";":
                block.setName("THEN");
                break;
              case "+":
                block.setName("AND"); 
                  break;
              case "|": 
                    block.setName("OR");
                break;
            
              default:
                break;
            }
        }
        else{
          var ruleDesc = usedRules[part];
         var newBlock = new VscadRulePropertyBlock(
           this.ruleArea,ruleDesc,this.saveRule);
           newBlock.text = ruleDesc.id;
          block.addAsChild(newBlock);
          
        }
        
        i++;
      }
     
      return block;
    },
  onDeviceBlockDown: function(event,desc,gateway) {

    const deviceRect = event.target.getBoundingClientRect();

    const x = deviceRect.left;
    const y = deviceRect.top;
    const newBlock = new VscadRulePropertyBlock(
      this.ruleArea,desc,this.saveRule);
    newBlock.text = desc.id;
    newBlock.snapToGrid(x, y);
    newBlock.vscadDraggable.onDown(event);
    this.ComposedRuleBlocks.push(newBlock);
  },
};

module.exports = VscadRulesScreen;
