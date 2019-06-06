/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

  //TODO 
  /*
    + CHANGE NODES AND FLOWS FOR REAL DATA
    + CHANGE  THE FUNCTION "NOTIFY" TO ACT WITH REAL TRIGGERS
  */
 
 const fetch = require("node-fetch");

 var testNodes = {};
 var testFlows = {}; 
 var testPointers = [];

 class MasterEngine {
  constructor(){
   if(! MasterEngine.instance){
      MasterEngine.instance = this;
      this.engine = {};
   }
   return MasterEngine.instance;
  
  }
 init(engine){
  this.engine.getRule = engine.getRule.bind(engine);
  this.engine.updateRule = engine.updateRule.bind(engine);
  this.engine.getRules = engine.getRules.bind(engine);
  
 
  
 }
 notify(rule,state){
 
    console.log(rule.id,testPointers);
    var pointerIndex =  this.getPointerOfRule(rule.id)
    this.turnOffRule(rule.id)
  
     testPointers[pointerIndex] = this.pointerActivate(this.pointerToNextNode(testPointers[pointerIndex] ))
  
  }
 execute(rule){
      this.turnOffAllRules();
      const fetchOptions = 
        {
          method: "POST", 
          cache: "no-cache", 
          headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",    
          },
          redirect: "follow", 
          referrer: "no-referrer",
          body: JSON.stringify(rule.toDescription()), 
      }
      fetch('http://localhost:9001/execute', fetchOptions).then((res)=>{
        
        res.json().then(data =>{

          testNodes = {};
          testFlows = {}; 
          testPointers = [];

          var nodes = data.nodes;
          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            testNodes[node.id] = node;
          }
          testFlows = data.flows;

          const firstPointer = {location:"init", node:testNodes['init']}
          testPointers.push(firstPointer);
          testPointers[0] = this.pointerActivate(this.pointerToNextNode(testPointers[0]));
          console.warn("deployed");
          
          // TODO  put data and flow to the correct variable
        })
      
      });
   
  }
 getRuleIdForTest(){
    const rand = Math.floor(Math.random() * testPointers.length);
    return  testPointers[rand].location;
 }
  getPointerOfRule(ruleId){
    
    for (let i = 0; i < testPointers.length; i++) {
      const pointer = testPointers[i];
      if( pointer.node.type == "TASK" && pointer.location == ruleId)
      return i;
    }
  
    for (let i = 0; i < testPointers.length; i++) {
      const pointer = testPointers[i];
      if( pointer.node.type == "FINAL" )
      return i;
    }
    console.error('retornando null en getPointerOfRule',testPointers,ruleId);
    return 1;
  }
  turnOffRule(ruleId){
    // check the type of pointer to deactivate the 
    if(this.engine.getRule){
    this.engine.getRule(ruleId).then((rule) => {
      rule.enabled = false;
      this.engine.updateRule(rule.id,rule);
      console.log(`setting up rule ${ruleId} to off`);
     })
    }
    else{
      console.log('144 - no engine',ruleId ,this.engine);
    }
  }
  turnOffAllRules(){
   if(this.engine.getRules){
    this.engine.getRules().then((rules) => {
      rules.forEach(rule => {
        if(rule.enabled){
          rule.enabled = false;
          this.engine.updateRule(rule.id,rule);
          console.log(`setting up rule ${rule.id} to off`);
        } 
      });
     })
    }
    else{
      console.log('no engine',this.engine);
    }
  }

  turnOnRule(ruleId){
    if(this.engine.getRule){
    this.engine.getRule(ruleId).then((rule) => {
      rule.enabled = true;
      this.engine.updateRule(rule.id,rule);
      rule.parent = this;
      console.log(`setting up rule ${ruleId} to on`);
     })
    }
     else{
      console.log('no engine',ruleId ,this.engine);
      
    }
  }
  pointerToNextNode(pointer,directionflow){

    var newPointer = {}

    newPointer.origins = pointer.origins;

    if(directionflow) {
      newPointer.location  = testFlows[directionflow].target
      if(!newPointer.origins) newPointer.origins = [];
      newPointer.origins.push(pointer.location);
    } 
    else {
        console.log(JSON.stringify(testFlows),pointer.node.outgoingFlows[0]);
        newPointer.location  = testFlows[pointer.node.outgoingFlows[0]].target
      }
      
    
     

    newPointer.node = testNodes[newPointer.location];

    return newPointer;
  }

  pointerActivate(pointer,index){
    const node = pointer.node;
    switch (node.type) {
      case 'INITIAL':
          pointer =  this.pointerActivate(this.pointerToNextNode(pointer))
        break;
      case 'FINAL':
          
        console.warn("acabamos");  
        break;
      case 'TASK':
         this.turnOnRule(node.id) 
        break;
      case 'EXCSPLIT':
      case 'PARSPLIT':
          node.outgoingFlows.forEach(flow => {
            testPointers.push(this.pointerActivate(this.pointerToNextNode(pointer,flow)));
          });
          testPointers.splice(testPointers.indexOf(pointer),1);
        break;
      case 'EXCMERGE':
      
          this.turnOffAllPointersWithOrigin(pointer.origins[pointer.origins.lenght-1])
          pointer =  this.pointerActivate(this.pointerToNextNode(pointer))

        break;
      case 'PARMERGE':
        //OPTIMIZATION:  save a boolean table, if all the values are true continue(there is no need of the loop);
          if(this.anyPointerWithOrigin(pointer.origins[pointer.origins.lenght-1])){
              testPointers.splice(testPointers.lastIndexOf(pointer),1);
          }else{
            
            pointer =  this.pointerActivate(this.pointerToNextNode(pointer))
          }
        break;
     default:
        break;
    }
    return pointer;
  }
  
  anyPointerWithOrigin(origin){
    for (let i = 0; i < testPointers.length; i++) {
      const pointer = testPointers[i];
      if(pointer.origins && pointer.origins.includes(origin))
        return true;
    }
    return false
  }

  turnOffAllPointersWithOrigin(origin){
    for (let i = testPointers.length-1; i >= 0; i--) {
      const pointer = testPointers[i];
      if(pointer.origins && pointer.origins.includes(origin)){
        this.turnOffRule(pointer.location);
        testPointers.splice(i,1);
      }  
    }
  }

}

const instance = new MasterEngine();
Object.freeze(instance);

export default instance;

