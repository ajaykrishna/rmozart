/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

 const nodes = require('./example.json').nodes;
 const flows = require('./example.json').flows;

 
 var testNodes = {};
 var testFlows = {}; 
 var testPointers = [];

 class MasterEngine {
  constructor(){
   if(! MasterEngine.instance){
      MasterEngine.instance = this;
      this.engine = {};
      
     //demo*
     
     
     for (let i = 0; i < nodes.length; i++) {
       const node = nodes[i];
       testNodes[node.id] = node;
     }
     for (let i = 0; i < flows.length; i++) {
       const flow = flows[i];
       testFlows[flow.id] = flow;
     }

     const firstPointer = {location:"start", node:testNodes['start']}
     testPointers.push(firstPointer);

     
     
     //*demo
     
   }
   console.log('creating enine instance');
   
   return MasterEngine.instance;
  
  }
 init(engine){
  this.engine.getRule = engine.getRule.bind(engine);
  this.engine.updateRule = engine.updateRule.bind(engine);
 
  testPointers[0] = this.pointerActivate(this.pointerToNextNode(testPointers[0]));
 }
 notify(rule,state){
   // this is just to test
  if(rule.id == 11){
  
    var  fakeId = this.getRuleIdForTest();

    console.log(fakeId,testPointers);
    var pointerIndex =  this.getPointerOfRule(fakeId)//rule.id
    
    if(!isNaN(parseInt(fakeId)))   
      this.turnOffRule(fakeId)//rule.id
  
    
     testPointers[pointerIndex] = this.pointerActivate(this.pointerToNextNode(testPointers[pointerIndex] ))
  }  
  }
 getRuleIdForTest(){
    const rand = Math.floor(Math.random() * testPointers.length);
    return  testPointers[rand].location;
 }
  getPointerOfRule(ruleId){
  
    for (let i = 0; i < testPointers.length; i++) {
      const pointer = testPointers[i];
      if(pointer.node.type == 'TASK' && pointer.location == ruleId)
      return i;
    }
   
    console.error('retornando null en getPointerOfRule');
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
      console.log('no engine',ruleId ,this.engine);
      
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
    else
      newPointer.location  = testFlows[pointer.node.outgoingFlows[0]].target;

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

