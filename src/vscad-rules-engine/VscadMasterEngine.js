/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

 const fetch = require("node-fetch");

 var testNodes = {};
 var testFlows = {}; 

 class MasterEngine {
  constructor(){
   if(! MasterEngine.instance){
      MasterEngine.instance = this;
      this.engine = {};
      this.testPointers = [];
      this.cacheData = {};
   }
   return MasterEngine.instance;
  
  }
 init(engine){
  this.engine.getRule = engine.getRule.bind(engine);
  this.engine.updateRule = engine.updateRule.bind(engine);
  this.engine.getRules = engine.getRules.bind(engine);
  
 }
 printPointers(){
  console.log("current state ASK",this.testPointers);
 }
 async notify(rule,state){
    var pointerIndex =  this.getPointerOfRule(rule.id)
    if(pointerIndex != -1){
      try{
      await this.turnOffRule(rule.id)
      this.pointerActivate(this.pointerToNextNode(this.testPointers[pointerIndex]),pointerIndex)
      }catch(e){
        console.log("no turn off",e);
        
      }
    }
  }
 execute(rule){
   console.log("hola");
   this.cacheData.rule = rule;
   if(rule.expression){
     console.log("executing rule :",rule)
    const fetchOptions = 
      {
        method: "POST", 
        cache: "no-cache",
        mode: 'no-cors', 
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
          
          this.testPointers.splice(0,this.testPointers.length);

          var nodes = data.nodes;
          if(nodes){
            for (let i = 0; i < nodes.length; i++) {
              const node = nodes[i];
              testNodes[node.id] = node;
            }
            testFlows = data.flows;
  
            this.testPointers[0] = {location:"init", node:testNodes['init']}
            this.pointerActivate(this.pointerToNextNode(this.testPointers[0]),0);
            console.warn("graph started", this.testPointers);
          }
       
          
  }
 
  getPointerOfRule(ruleId){
    
    for (let i = 0; i < this.testPointers.length; i++) {
      const pointer = this.testPointers[i];
      if( pointer.node.type == "TASK" && pointer.location == ruleId)
      return i;
    }
    return -1;
  }
   async turnOffRule(ruleId){
    // check the type of pointer to deactivate the 

      var rule = await this.engine.getRule(ruleId);
      rule.enabled = false;
      await  this.engine.updateRule(rule.id,rule);
      console.log(`setting up rule ${ruleId} to off`);
    
  }

  async turnOffAllRules(){
  
     var rules = await this.engine.getRules();
     for (let i = 0; i < rules.length; i++) {
       const rule = rules[i];
       if(rule.enabled){
        rule.enabled = false;
        await this.engine.updateRule(rule.id,rule);
        console.log(`setting up rule ${rule.id} to off- all`);
      } 
     }
  
  }

  async turnOnRule(ruleId){
      var rule = await this.engine.getRule(ruleId)
      rule.enabled = true;
      await this.engine.updateRule(rule.id,rule);
      rule.parent = this;
      console.log(`setting up rule ${ruleId} to on`);
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

  async pointerActivate(pointer,index){
    const node = pointer.node;
    var add = true;
    console.log(node.type,"activated");
    switch (node.type) {
      case 'INITIAL':
           this.pointerActivate(this.pointerToNextNode(pointer),index)
        break;
      case 'FINAL':
          this.testPointers[0] = {location:"init", node:testNodes['init']}
          this.pointerActivate(this.pointerToNextNode(this.testPointers[0]),0);
            console.warn("acabamos");
            add = false;
        break;
      case 'TASK':
        try {
          await this.turnOnRule(node.id) 
        } catch (error) {
          console.log("no turn on task",error);  
        }
       
        break;
      case 'EXCSPLIT':
      case 'PARSPLIT':
          
          node.outgoingFlows.forEach(flow => {
            this.pointerActivate(this.pointerToNextNode(pointer,flow), this.testPointers.length);
          });
          console.log("deleting ",this.testPointers.splice(index,1));
          console.log("current state AFTER SPLIT",this.testPointers);
          add = false
          
        break;
      case 'EXCMERGE':
          //console.log('availavle origins EXCMERGE',pointer.origins);
           
          this.turnOffAllPointersWithOrigin(pointer.origins[pointer.origins.length-1])
          this.pointerActivate(this.pointerToNextNode(pointer),index)
         // console.log("pointers after XCMERGE",this.testPointers);
         add = false;
        break;
      case 'PARMERGE':
        //OPTIMIZATION:  save a boolean table, if all the values are true continue(there is no need of the loop);
          if(this.anyPointerWithOrigin(pointer.origins[pointer.origins.length-1])){
           console.log('entro al merg',this.testPointers.splice(index,1));
           
          }else{
         //   console.log('par merge no encontro mas origins')
            this.pointerActivate(this.pointerToNextNode(pointer),index)
          }
          add = false;
         // console.log("pointers after parMERGE",this.testPointers);
        break;
     default:
       console.log('non handeled',node.type);
       
        break;
    }
    
  if(add)
  this.testPointers[index] = pointer;
  }
  
  anyPointerWithOrigin(origin){
    //console.log('testing origin' ,origin);
    var count = 0;
    for (let i = 0; i < this.testPointers.length; i++) {
      const pointer = this.testPointers[i];
      if(pointer.origins && pointer.origins.includes(origin)){
        count++;
        if(count == 2 )  return true;
      }
    }
    return false
  }

  async turnOffAllPointersWithOrigin(origin){
    console.log('turning all' ,origin);

    for (let i = this.testPointers.length-1; i >= 0; i--) {
      const pointer = this.testPointers[i];
      if(pointer.origins && pointer.origins.includes(origin)){
         try{
         await  this.turnOffRule(pointer.location);
        console.log("delting for slow", this.testPointers.splice(i,1));
         }
         catch(e){
           console.log("no turnoff all",e);
           
         }
        

         
      }  
    }
    console.log("current state after turn off all",this.testPointers);
  }

}

const instance = new MasterEngine();
Object.freeze(instance);

export default instance;

