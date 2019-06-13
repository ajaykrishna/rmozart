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
 var cacheData = {};
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
 printPointers(){
  console.log("current state ASK",testPointers);
 }
 notify(rule,state){
    var pointerIndex =  this.getPointerOfRule(rule.id)
    if(pointerIndex != -1){
       this.turnOffRule(rule.id)
      this.pointerActivate(this.pointerToNextNode(testPointers[pointerIndex]),pointerIndex)
    }
  }
 execute(rule){
   console.log("hola");
   
   if(rule.expression){
     console.log("executing rule :",rule)
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
        console.warn("Deploying");
        cacheData = data;
        this.initGraph(data);      
       
      })
    
    });
   }
    else{
      console.log("not executing rule :",rule)
    } 
  }
  initGraph(data){
   
          testNodes = {};
          testFlows = {}; 
          testPointers = [];

          var nodes = data.nodes;
          if(nodes){
            for (let i = 0; i < nodes.length; i++) {
              const node = nodes[i];
              testNodes[node.id] = node;
            }
            testFlows = data.flows;
  
            testPointers[0] = {location:"init", node:testNodes['init']}
            this.pointerActivate(this.pointerToNextNode(testPointers[0]),0);
            console.warn("graph started", testPointers);
          }
          
  }
 
  getPointerOfRule(ruleId){
    
    for (let i = 0; i < testPointers.length; i++) {
      const pointer = testPointers[i];
      if( pointer.node.type == "TASK" && pointer.location == ruleId)
      return i;
    }
    return -1;
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
        newPointer.location  = testFlows[pointer.node.outgoingFlows[0]].target
      }
    newPointer.node = testNodes[newPointer.location];

    return newPointer;
  }

  pointerActivate(pointer,index){
    const node = pointer.node;
    var add = true;
    console.log(node.type,"activated");
    switch (node.type) {
      case 'INITIAL':
           this.pointerActivate(this.pointerToNextNode(pointer),index)
        break;
      case 'FINAL':
        this.turnOffAllRules();
            console.warn("acabamos");
            this.initGraph(cacheData)
           
        break;
      case 'TASK':
         this.turnOnRule(node.id) 
        break;
      case 'EXCSPLIT':
      case 'PARSPLIT':
          
          node.outgoingFlows.forEach(flow => {
            this.pointerActivate(this.pointerToNextNode(pointer,flow), testPointers.length);
          });
          console.log("deleting ",testPointers.splice(index,1));
          console.log("current state AFTER SPLIT",testPointers);
          add = false
          
        break;
      case 'EXCMERGE':
          //console.log('availavle origins EXCMERGE',pointer.origins);
           
          this.turnOffAllPointersWithOrigin(pointer.origins[pointer.origins.length-1])
          this.pointerActivate(this.pointerToNextNode(pointer),index)
         // console.log("pointers after XCMERGE",testPointers);
         add = false;
        break;
      case 'PARMERGE':
        //OPTIMIZATION:  save a boolean table, if all the values are true continue(there is no need of the loop);
          if(this.anyPointerWithOrigin(pointer.origins[pointer.origins.length-1])){
           console.log('entro al merg',testPointers.splice(index,1));
           
          }else{
         //   console.log('par merge no encontro mas origins')
            this.pointerActivate(this.pointerToNextNode(pointer),index)
          }
          add = false;
         // console.log("pointers after parMERGE",testPointers);
        break;
     default:
       console.log('non handeled',node.type);
       
        break;
    }
    
  if(add)
  testPointers[index] = pointer;
  }
  
  anyPointerWithOrigin(origin){
    //console.log('testing origin' ,origin);
    var count = 0;
    for (let i = 0; i < testPointers.length; i++) {
      const pointer = testPointers[i];
      if(pointer.origins && pointer.origins.includes(origin)){
        count++;
        if(count == 2 )  return true;
      }
    }
    return false
  }

  turnOffAllPointersWithOrigin(origin){
    console.log('turning all' ,origin);

    for (let i = testPointers.length-1; i >= 0; i--) {
      const pointer = testPointers[i];
      if(pointer.origins && pointer.origins.includes(origin)){
        this.turnOffRule(pointer.location);
        console.log("delting for slow", testPointers.splice(i,1));
        

         
      }  
    }
    console.log("current state after turn off all",testPointers);
  }

}

const instance = new MasterEngine();
Object.freeze(instance);

export default instance;

