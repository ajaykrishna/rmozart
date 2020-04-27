/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */
const API = require('./api');
const Gateway = require('./rules/Gateway');
const page = require('page');
const VscadComposedRule = require('./rules/VscadComposedRule');
const VscadRuleCardItem = require('./rules/VscadRuleCardItem');
const VscadConnectorBlock = require('./rules/VscadConnectorBlock');
const VscadRulePropertyBlock = require('./rules/VscadRulePropertyBlock');

'use-strict';

const ReconfigureScreen = {
  init: function () {
    this.rulesList = document.getElementById('rules-side-menu-reconfigure');
    this.ruleArea = document.getElementById('rules-area-reconf');
    this.ruleLeft = document.getElementById('rule-right');
    this.ruleRight = document.getElementById('rule-left');
    this.loader = document.getElementById('loader-holder-reconf');
    this.deleteArea = document.getElementById('vscad-delete-area-reconf');

    this.compareButton = document.getElementById('compare-reconf-button');
    this.deployButton = document.getElementById('deploy-reconf-button');
    this.saveButton = document.getElementById('save-reconf-button');

    //  this.saveRule = this.saveRule.bind(this);

    this.saveRule = this.saveRule.bind(this);

    this.gateway = new Gateway();
    this.ComposedRuleBlocks = [];
    this.connectors = {};
    this.loaders = 0;
    this.view = document.getElementById('reconfigure-view');
    this.ruleNameCustomize = this.view.querySelector('.rule-name-reconf');
    this.ruleName = this.view.querySelector('.reconf-rule-name');

    this.connectors.after = document.getElementById('part-after-reconf');
    this.connectors.after.addEventListener('mousedown', (event) => this.onconnectorBlockDown(event, 'THEN'));
    this.connectors.and = document.getElementById('part-and-reconf');
    this.connectors.and.addEventListener('mousedown', (event) => this.onconnectorBlockDown(event, 'AND'));
    this.connectors.or = document.getElementById('part-or-reconf');
    this.connectors.or.addEventListener('mousedown', (event) => this.onconnectorBlockDown(event, 'OR'));
    this.connectors.group = document.getElementById('part-other-reconf');
    this.connectors.group.addEventListener('mousedown', (event) => this.onconnectorBlockDown(event, 'group'));
    this.nextId = 0;

    const selectRuleName = () => {
      const range = document.createRange();
      range.selectNodeContents(this.ruleName);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    };
    this.compareButton.addEventListener('click', () => {
      this.requestUpdate();
    });
    this.saveButton.addEventListener('click', () => {
    });
    this.deployButton.addEventListener('click', () => {

    });
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
  },
  requestUpdate: async function () {

    var json1 = this.getOldStates();
    await json1.then((data) => {
      json1 = data;
    })
    console.log(json1);
    var json2 = this.getCurrentlyStates();
    await json2.then((data) => {
      json2 = data;
    })
    console.log(json2);
    // Send final JSON
    const datosJson = {};
    datosJson.oldJson = json1;
    datosJson.newJson = json2;
    this.showLoader();
    const fetchedJson = {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      redirect: 'follow',
      referrer: 'no-referrer',
      body: JSON.stringify(datosJson),
    };

    fetch('http://localhost:9001/verify', fetchedJson).then((res) => {
      return res.json();
    }).then((response) => {
      this.hiddeLoader();
      this.showNotification(response);
    });
  },
  showNotification: function (data) {
    const alertDialog = document.getElementById('validation-dialog-reconf');
    alertDialog.style.display = 'block';
    if (data.status) {
      alertDialog.querySelector('#tittle-reconf').textContent = 'Compared';
      alertDialog.querySelector('#noti-message-reconf').textContent = 'Message aditional';
      alertDialog.querySelector('img').src = '../images/tick-mark.png';
    } else {
      alertDialog.querySelector('#tittle-reconf').textContent = 'Problem found';
      alertDialog.querySelector('img').src = '../images/rejected-mark.png';
      alertDialog.querySelector('#noti-message-reconf').textContent = 'Message aditional';
    }
    alertDialog.querySelector('#noti-message-reconf').textContent = data.response;
  },
  showLoader: function () {
    this.loaders++;
    this.loader.style.display = 'block';
  },
  hiddeLoader: function () {
    this.loaders--;
    this.loader.style.display = 'none';
  },
  getOldStates: async function () {
    return new Promise((resolve) => {
      var rules = [];
      var formatJson = {};
      var cant = 0;
      //console.log(this.cRule.expression2 , 'this is the other expression');
      var expression = this.cRule.expression2;
      var data = this.cRule.toDescription();
      // Get id's of the currrently composition
      fetch('/rules', { headers: API.headers() }).then((res) => {
        return res.json();
      }).then((fetchedRules) => {
        for (const ruleDesc of fetchedRules) {
          if (data.rules.includes(String(ruleDesc.id))) {
            rules.push(ruleDesc);
            cant += 1;
          }
        }
      }).finally(async () => {
        formatJson.Rules = [];
        formatJson.Exp = expression;
        formatJson.Rule = {};

        for (let index = 0; index < cant; index++) {
          formatJson.Rules.push(rules[index].name);
          var id = rules[index].id;
          formatJson.Rule[id] = {};
          formatJson.Rule[id].triggers = {};
          formatJson.Rule[id].triggers.operator = rules[index].trigger.op;
          formatJson.Rule[id].effects = {};
          formatJson.Rule[id].triggers.objets = [];
          formatJson.Rule[id].effects.objets = [];
          for (const data of rules[index].trigger.triggers) {
            await API.getJson(`/things/${data.property.thing}/properties`).then((data2) => {
              // console.log('trigger', String(data.property.thing), data2);
              const info = {};
              info.objetId = data.property.thing;
              info.state = data2;
              formatJson.Rule[id].triggers.objets.push(info);
            });
          }
          for (const data of rules[index].effect.effects) {
            await API.getJson(`/things/${data.property.thing}/properties`).then((data2) => {
              // console.log('effect', String(data.property.thing), data2);
              const info2 = {};
              info2.objetId = data.property.thing;
              info2.state = data2;
              formatJson.Rule[id].effects.objets.push(info2);
            });
          }
        }
        resolve(formatJson);
        //console.log('This is the old Json ', JSON.stringify(formatJson));
      });
    });

  },
  getCurrentlyStates: function () {
    return new Promise((resolve) => {
      var rules = [];
      var formatJson = {};
      var cant = 0;
      var ids = this.cRule.getRulesFromExpression();
      var expression = this.cRule.getExpression();
      rules = [];
      fetch('/rules', { headers: API.headers() }).then((res) => {
        return res.json();
      }).then((fetchedRules) => {
        for (const ruleDesc of fetchedRules) {
          if (ids.includes(String(ruleDesc.id))) {
            rules.push(ruleDesc);
            cant += 1;
          }
        }
      }).finally(async () => {
        formatJson.Rules = [];
        formatJson.Exp = expression;
        formatJson.Rule = {};

        for (let index = 0; index < cant; index++) {
          formatJson.Rules.push(rules[index].name);
          const id = rules[index].id;
          formatJson.Rule[id] = {};
          formatJson.Rule[id].triggers = {};
          formatJson.Rule[id].triggers.operator = rules[index].trigger.op;
          formatJson.Rule[id].effects = {};
          formatJson.Rule[id].triggers.objets = [];
          formatJson.Rule[id].effects.objets = [];
          for (const data of rules[index].trigger.triggers) {
            // console.log('trigger', String(data.property.thing), data2);
            const info = {};
            info.objetId = data.property.thing;
            formatJson.Rule[id].triggers.objets.push(info);
          }

          for (const data of rules[index].effect.effects) {
            // console.log('effect', String(data.property.thing), data2);
            const info2 = {};
            info2.objetId = data.property.thing;
            formatJson.Rule[id].effects.objets.push(info2);
          }
        }
        resolve(formatJson);
        // console.log('This is the new Json ', JSON.stringify(formatJson));
      });
    });
  },
  show: function (composedId) {
    this.gateway.readThings().then(() => {
      return this.readRules();
    });
    let rulePromise = Promise.resolve(null);
    if (composedId !== 'new') {
      rulePromise = fetch(`/composed-rules/${encodeURIComponent(composedId)}`, {
        headers: API.headers(),
      }).then((res) => {
        return res.json();
      });
    }
    rulePromise.then((ruleDesc) => {
      console.log(this.ComposedRuleBlocks.length <= 0);
      if (this.ComposedRuleBlocks.length <= 0) {
        this.cRule = new VscadComposedRule(this.gateway, ruleDesc);
        this.cRule.update();
        this.prepareVisual(this.cRule.toDescription(), this.gateway, this.fetchedRules);
      }
    });
  },
  saveRule: function () {
    let longest = '';
    let foundRules = 0;
    for (let i = this.ComposedRuleBlocks.length - 1; i >= 0; i--) {
      const block = this.ComposedRuleBlocks[i];
      if (block && block.role == '') {
        if (longest.length < block.getText().length) {
          longest = block.getText();
        }
        foundRules++;
      } else if (block.role == 'removed') {
        this.ComposedRuleBlocks.splice(i, 1);
      }
    }
    document.getElementById('warning-message-reconf').style.display = (foundRules > 1) ? 'block' : 'none';
    this.cRule.setExpression2(longest);
  },
  /**
   * @return {Promise<Array<RuleDescription>>}
   */
  readRules: function () {
    const createRuleButton = document.createElement('div');
    createRuleButton.innerHTML = ` <div class="rule-part-block trigger">
  <img  src="/optimized-images/add.svg">
  </div>
  <div class="rule-info">
      <h3>NEW RULE</h3>
  </div>`;
    createRuleButton.setAttribute('id', 'create-rule-shortcut');
    createRuleButton.setAttribute('class', 'rule');

    createRuleButton.addEventListener('click', () => {
      page('/rules/quickNew');
    });
    this.showLoader();
    fetch('/rules', { headers: API.headers() }).then((res) => {
      return res.json();
    }).then((fetchedRules) => {
      this.rulesList.querySelectorAll('.rule').forEach((elt) => {
        elt.parentNode.removeChild(elt);
      });
      this.rulesList.appendChild(createRuleButton);
      for (const ruleDesc of fetchedRules) {
        this.addVscadRuleCardItem(ruleDesc);
      }
      this.fetchedRules = fetchedRules;

      if (this.ComposedRuleBlocks.length <= 0) {
        this.prepareVisual(this.cRule.toDescription(), this.gateway, this.fetchedRules);
      }
    }).finally(() => {
      this.hiddeLoader();
    });
  },
  prepareVisual: function (desc, gateway, fetchedRules) {
    if (desc.expression && gateway && fetchedRules) {
      const usedRules = {};
      // get all the used rules
      for (const ruleDesc of fetchedRules) {
        if (desc.rules.includes(String(ruleDesc.id))) {
          usedRules[String(ruleDesc.id)] = ruleDesc;
        }
      }
      const parts = desc.expression.split(' ');
      const newBlock = this.getBlockOf(parts.slice(1, parts.length - 1), usedRules);
      this.ComposedRuleBlocks.push(newBlock);
      newBlock.snapToGrid(20, 20);
      // sets the name on the titel
      this.ruleName.textContent = desc.name;
    }
  },
  getBlockOf: function (parts, usedRules) {
    let i = 0;
    const block = new VscadConnectorBlock(this.ruleLeft, this.saveRule, this.deleteArea);

    while (i < parts.length) {
      const part = parts[i];
      if (part == '(') {
        let j = i + 1;
        let count = 1;
        while (count >= 1 && j < parts.length) {
          if (parts[j] == ')') {
            count--;
          }
          if (parts[j] == '(') {
            count++;
          }
          j++;
        }
        block.addAsChild(this.getBlockOf(parts.slice(i + 1, j), usedRules));
        i = j - 1;
      } else if (isNaN(Number(part))) {
        if (!block.name) {
          switch (part) {
            case ';':
              block.setName('THEN');
              break;
            case '+':
              block.setName('AND');
              break;
            case '|':
              block.setName('OR');
              break;
            default:
              break;
          }
        }
      } else {
        const ruleDesc = usedRules[part];
        const newBlock = new VscadRulePropertyBlock(this.ruleArea, ruleDesc, this.saveRule, this.deleteArea);
        newBlock.text = ruleDesc.id;
        block.addAsChild(newBlock);
      }
      i++;
    }

    return block;
  },
  /**
 * Add a rule, filling it with the data from a RuleDescription
 * @param {RuleDescription} desc
 */
  addVscadRuleCardItem: function (desc) {
    const ruleElt = document.createElement('div');
    ruleElt.classList.add('rule');
    try {
      new VscadRuleCardItem(this.gateway, ruleElt, this.nextId, desc);
    } catch (e) {
      console.error('Invalid rule', desc, e);
      this.nextId += 1;
      return;
    }
    ruleElt.addEventListener('mousedown', (event) => {
      this.onDeviceBlockDown(event, desc, this.gateway);
    });
    this.nextId += 1;
    this.rulesList.appendChild(ruleElt);
  },
  onconnectorBlockDown: function (event, type) {
    const deviceRect = event.target.getBoundingClientRect();
    const x = deviceRect.left;
    const y = deviceRect.top;
    const newBlock = new VscadConnectorBlock(this.ruleArea, this.saveRule, this.deleteArea, type);
    newBlock.snapToGrid(x, y);
    newBlock.vscadDraggable.onDown(event);
    this.ComposedRuleBlocks.push(newBlock);
  },
  onDeviceBlockDown: function (event, desc, gateway) {
    const deviceRect = event.target.getBoundingClientRect();
    const x = deviceRect.left;
    const y = deviceRect.top;
    const newBlock = new VscadRulePropertyBlock(this.ruleArea, desc, this.saveRule, this.deleteArea);
    newBlock.text = desc.id;
    newBlock.snapToGrid(x, y);
    newBlock.vscadDraggable.onDown(event);
    this.ComposedRuleBlocks.push(newBlock);
  },
};

module.exports = ReconfigureScreen;
