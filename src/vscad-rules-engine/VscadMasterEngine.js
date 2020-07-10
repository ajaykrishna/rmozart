/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

const fetch = require('node-fetch');

var testNodes = {};
var testFlows = {};

class MasterEngine {
  constructor() {
    if (!MasterEngine.instance) {
      MasterEngine.instance = this;
      this.engine = {};
      this.testPointers = [];
      this.cacheData = {};
    }
    return MasterEngine.instance;

  }

  init(engine) {
    this.engine.getRule = engine.getRule.bind(engine);
    this.engine.updateRule = engine.updateRule.bind(engine);
    this.engine.getRules = engine.getRules.bind(engine);

  }

  printPointers() {
    console.log('current state ASK', this.testPointers);
  }

  async notify(rule, state) {
    var pointerIndex = this.getPointerOfRule(rule.id);
    if (pointerIndex !== -1) {
      try {
        await this.turnOffRule(rule.id);
        await this.pointerActivate(this.pointerToNextNode(this.testPointers[pointerIndex]), pointerIndex);
      } catch (e) {

      }
    }
  }

  execute(rule) {
    this.cacheData.rule = rule;
    if (rule.expression) {
      const fetchOptions =
        {
          method: 'POST',
          cache: 'no-cache',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          redirect: 'follow',
          referrer: 'no-referrer',
          body: JSON.stringify(rule.toDescription()),
        };
      fetch('http://localhost:9001/execute', fetchOptions).then((res) => {
        res.json().then(data => {
          console.log('Deploying...');
          this.initGraph(data);
        });

      }).catch((error) => {
        console.warn('java server turned off', error.message);
      });
    }
  }

  initGraph(data) {
    this.turnOffAllRules();
    testNodes = {};
    testFlows = {};

    this.testPointers.splice(0, this.testPointers.length);

    var nodes = data.nodes;
    if (nodes) {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        testNodes[node.id] = node;
      }
      testFlows = data.flows;

      this.testPointers[0] = {location: 'init', node: testNodes['init']};
      this.pointerActivate(this.pointerToNextNode(this.testPointers[0]), 0);
      console.log('graph started');
    }
  }

  getPointerOfRule(ruleId) {
    for (let i = 0; i < this.testPointers.length; i++) {
      const pointer = this.testPointers[i];
      if (pointer.node.type == 'TASK' && pointer.location == ruleId) {
        return i;
      }
    }
    return -1;
  }

  async turnOffRule(ruleId) {
    // check the type of pointer to deactivate the
    var rule = await this.engine.getRule(ruleId);
    rule.enabled = false;
    await this.engine.updateRule(rule.id, rule);


  }

  async turnOffAllRules() {

    var rules = await this.engine.getRules();
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      if (rule.enabled) {
        rule.enabled = false;
        await this.engine.updateRule(rule.id, rule);
      }
    }

  }

  async turnOnRule(ruleId) {

    var rule = await this.engine.getRule(ruleId);
    rule.enabled = true;
    await this.engine.updateRule(rule.id, rule);
    rule.parent = this;
  }

  pointerToNextNode(pointer, directionflow) {

    var newPointer = {};
    newPointer.origins = [];
    if (pointer.origins) {
      pointer.origins.forEach(origin => {
        newPointer.origins.push(origin);
      });
    }

    if (directionflow) {
      newPointer.location = testFlows[directionflow].target;
      newPointer.origins.push(pointer.location);
    } else {
      newPointer.location = testFlows[pointer.node.outgoingFlows[0]].target;
    }
    newPointer.node = testNodes[newPointer.location];
    return newPointer;
  }

  async pointerActivate(pointer, index) {

    const node = pointer.node;
    var add = true;
    switch (node.type) {
      case 'INITIAL':
        await this.pointerActivate(this.pointerToNextNode(pointer), index);
        break;
      case 'FINAL':
        this.testPointers[0] = {location: 'init', node: testNodes['init']};
        await this.pointerActivate(this.pointerToNextNode(this.testPointers[0]), 0);
        console.log('Rule finished');
        add = false;
        break;
      case 'TASK':
        await this.turnOnRule(node.id);
        break;
      case 'EXCSPLIT':
      case 'PARSPLIT':
        this.testPointers.splice(index, 1);
        for (let i = 0; i < node.outgoingFlows.length; i++) {
          const flow = node.outgoingFlows[i];
          var ind = this.testPointers.push(pointer) - 1;
          await this.pointerActivate(this.pointerToNextNode(this.testPointers[ind], flow), ind);
        }
        add = false;
        break;
      case 'EXCMERG':
        var origin = pointer.origins.pop();
        this.turnOffAllPointersWithOrigin(origin);
        const j = this.testPointers.push(pointer) - 1;
        await this.pointerActivate(this.pointerToNextNode(pointer), j);

        add = false;
        break;
      case 'PARMERGE':
        var origin = pointer.origins.pop();
        this.testPointers.splice(index, 1);
        // OPTIMIZATION:  save a boolean table, if all the values are true continue(there is no need of the loop);
        if (!this.anyPointerWithOrigin(origin)) {
          await this.pointerActivate(this.pointerToNextNode(pointer), this.testPointers.push(pointer) - 1);
        }
        add = false;

        break;
    }

    if (add) {
      this.testPointers[index] = pointer;
    }
  }

  anyPointerWithOrigin(origin) {
    for (let i = 0; i < this.testPointers.length; i++) {
      const pointer = this.testPointers[i];
      if (pointer.origins && pointer.origins.includes(origin)) {
        return true;
      }
    }
    return false;
  }

  turnOffAllPointersWithOrigin(origin) {
    for (let i = this.testPointers.length - 1; i >= 0; i--) {
      const pointer = this.testPointers[i];
      if (pointer.origins && pointer.origins.includes(origin)) {
        if (pointer.node.type == 'TASK') {
          this.turnOffRule(pointer.location);
        }
        this.testPointers.splice(i, 1);
      }
    }
  }

}

const instance = new MasterEngine();
//Object.freeze(instance);

export default instance;

