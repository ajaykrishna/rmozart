/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */
const API = require('./api').default;
const BpmnJS = require('bpmn-js').default;
const Gateway = require('./rules/Gateway');
const VscadRuleCardItem = require('./rules/VscadRuleCardItem');
const page = require('page');
const VscadRulePropertyBlock = require('./rules/VscadRulePropertyBlock');
const VscadComposedRule = require('./rules/VscadComposedRule');
const VscadConnectorBlock = require('./rules/VscadConnectorBlock');

('use strict');

// eslint-disable-next-line no-unused-vars
const VscadRulesScreen = {
  init: function () {
    // reconfigure analyse components
    this.analyseViewWrapper = document.getElementById('analyse-component'); // modal
    this.analyseView = document.getElementById('analyse-view');
    this.analyseCanvas = document.getElementById('analyse-canvas-wrapper');
    this.analyseTable = document.getElementById('analyse-table-wrapper');
    // this.diagram2 = document.getElementById('analyse-canvas-2');
    this.tableOriginal = document.getElementById('analyse-table-original-body');
    this.tableReconfig = document.getElementById('analyse-table-reconfig-body');
    this.analyseBtn = document.getElementById('analyse-modal-btn');
    this.addToTable = document.querySelectorAll('.add-to-table');
    this.analyseBpmnXMLs = null;
    this.arrComposedRules = null;
    this.arrReconfigureRules = null;
    this.analyseModalStepper = 0;
    this.storedAnalyseRules = {
      current: {},
      reconfigure: {},
    };

    //
    this.rulesList = document.getElementById('rules-side-menu');
    this.ruleArea = document.getElementById('rules-area');
    this.loader = document.getElementById('loader-holder');
    this.deleteArea = document.getElementById('vscad-delete-area');

    this.updateButon = document.getElementById('update-button');
    this.reconfButton = document.getElementById('reconf-button');
    this.testButton = document.getElementById('test-button');
    // modal
    this.diagramView = document.getElementById('diagram-view');

    this.diagramButton = document.getElementById('diagram-button');
    this.verificationButton = document.getElementById('verification-button');
    this.saveButton = document.getElementById('save-button');
    this.deployButton = document.getElementById('deploy-button');
    this.mclButton = document.getElementById('mcl-button');
    this.mclCheckButton = document.getElementById('mcl-check-button');
    this.mclFormula = document.getElementById('mcl-formula');
    this.mclDialog = document.getElementById('mcl-dialog');

    this.saveRule = this.saveRule.bind(this);

    this.gateway = new Gateway();
    this.ComposedRuleBlocks = [];
    this.connectors = {};
    this.diagramLoaded = false;
    this.loaders = 0;
    // tittle bariables and the editin functionalities
    this.view = document.getElementById('rules-manager-view');
    this.ruleNameCustomize = this.view.querySelector('.rule-name-customize');
    this.ruleName = this.view.querySelector('.rule-name');

    this.setConectorButtons();

    // sets the listeners for all requiered nodes, elements
    this.setEventListeners();
  },

  setConectorButtons() {
    // connector buttons
    this.connectors.after = document.getElementById('part-after');
    this.connectors.after.addEventListener('mousedown', (event) =>
      this.onconnectorBlockDown(event, 'THEN')
    );
    this.connectors.and = document.getElementById('part-and');
    this.connectors.and.addEventListener('mousedown', (event) =>
      this.onconnectorBlockDown(event, 'AND')
    );
    this.connectors.or = document.getElementById('part-or');
    this.connectors.or.addEventListener('mousedown', (event) =>
      this.onconnectorBlockDown(event, 'OR')
    );
    this.connectors.group = document.getElementById('part-other');
    this.connectors.group.addEventListener('mousedown', (event) =>
      this.onconnectorBlockDown(event, 'group')
    );
    this.nextId = 0;
  },

  setEventListeners() {
    const selectRuleName = () => {
      // Select all of ruleName, https://stackoverflow.com/questions/6139107/
      const range = document.createRange();
      range.selectNodeContents(this.ruleName);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    };

    // Reconfigure Analyse set

    // btn add to table node add to table
    this.addToTable.forEach((btn) => {
      btn.addEventListener('click', () => {
        // analyse-table-original or analyse-table-reconfig
        const table = document.getElementById(btn.getAttribute('data-table'));
        const form = document.getElementById(btn.getAttribute('data-form'));

        const costProb = form.querySelector('#cost-prob-select');
        const rule = form.querySelector('#rules-select');
        const eventAction = form.querySelector('#event-action-select');
        const value = form.querySelector('input[name="analyse-value"]');

        this.handleAnalyseCostProbability(table, form, costProb, rule, eventAction, value);
      });
    });

    // btn Analyse listener
    this.analyseBtn.addEventListener('click', () => {
      if (this.analyseModalStepper <= 2 /*  */) {
        this.handleAnalyseView(this.analyseBpmnXMLs, ++this.analyseModalStepper);
      } else {
        console.log('do calculation');
      }
    });

    // modal
    this.diagramView.addEventListener('click', () => {
      this.diagramView.classList.remove('selected');
      this.diagramView.style.display = 'none';
      this.hiddeVerification();
      this.hiddeDiagram();
      this.hideMclDialog();
    });

    this.mclDialog.addEventListener('click', (event) => {
      event.stopPropagation();
    });
    this.testButton.addEventListener('click', () => {
      fetch('/composed-rules/deploy/ask', { headers: API.headers() }).then((res) => {
        console.log(res);
      });
    });
    this.deployButton.addEventListener('click', () => {
      this.deployRule();
    });
    this.reconfButton.addEventListener('click', () => {
      this.showLoader();
    });
    this.verificationButton.addEventListener('click', () => {
      this.requestVerify();
    });
    this.mclButton.addEventListener('click', () => {
      this.showMclDialog();
      // this.requestMcl();
    });
    this.mclCheckButton.addEventListener('click', () => {
      this.requestMcl();
    });
    this.diagramButton.addEventListener('click', () => {
      this.requestDiagram();
    });
    this.saveButton.addEventListener('click', () => {
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
  },

  showLoader() {
    this.loaders++;
    this.loader.style.display = 'block';
  },
  hiddeLoader() {
    this.loaders--;
    if (this.loaders <= 0) {
      this.loader.style.display = 'none';
      this.loaders = 0;
    }
  },

  showVerification: function (response, data) {
    if (data === true) {
      console.log('this is the response', response);
      this.diagramView.classList.add('selected');
      this.diagramView.style.display = 'flex';
      this.hiddeDiagram();
      this.hideMclDialog();
      const alertDialog = document.getElementById('validation-dialog');
      alertDialog.style.display = 'block';
      alertDialog.querySelector('#tittle').textContent = 'Result';
      if (response.status) {
        alertDialog.querySelector('#tittle').textContent = 'Verified';
        const imagen = document.getElementById('this-image');
        const padre = imagen.parentNode;
        padre.removeChild(imagen);
      } else {
        const imagen = document.getElementById('this-image');
        const padre = imagen.parentNode;
        padre.removeChild(imagen);

        alertDialog.querySelector('#seamless').textContent = 'Seamless';
        // alertDialog.querySelector('#seamlessResult').textContent = response.seamless;
        if (response.seamless) {
          alertDialog.querySelector('#seamlessResult').innerHTML =
            '<img src="../images/tick-mark.png"></img>';
        } else {
          alertDialog.querySelector('#seamlessResult').innerHTML =
            '<img src="../images/rejected-mark.png"></img>';
        }

        alertDialog.querySelector('#conservative').textContent = 'Conservative';
        if (response.conservative) {
          alertDialog.querySelector('#conservativeResult').innerHTML =
            '<img src="../images/tick-mark.png"></img>';
        } else {
          alertDialog.querySelector('#conservativeResult').innerHTML =
            '<img src="../images/rejected-mark.png"></img>';
        }

        alertDialog.querySelector('#impactful').textContent = 'Impactful';
        if (response.impactful) {
          alertDialog.querySelector('#impactfulResult').innerHTML =
            '<img src="../images/tick-mark.png"></img>';
        } else {
          alertDialog.querySelector('#impactfulResult').innerHTML =
            '<img src="../images/rejected-mark.png"></img>';
        }
      }
      alertDialog.querySelector('#noti-message').textContent = response.message;
    } else {
      this.diagramView.classList.add('selected');
      this.diagramView.style.display = 'flex';
      this.hiddeDiagram();
      this.hideMclDialog();

      const alertDialog = document.getElementById('validation-dialog');
      alertDialog.style.display = 'block';
      if (response.status) {
        alertDialog.querySelector('#tittle').textContent = 'Verified';
        alertDialog.querySelector('img').src = '../images/tick-mark.png';
      } else {
        alertDialog.querySelector('#tittle').textContent = 'Problem found';
        alertDialog.querySelector('img').src = '../images/rejected-mark.png';
      }
      alertDialog.querySelector('#noti-message').textContent = response.message;
    }
  },

  hiddeVerification: function () {
    const alertDialog = document.getElementById('validation-dialog');
    alertDialog.style.display = 'none';
  },

  hiddeDiagram() {
    const diagram = document.getElementById('canvas');
    diagram.style.display = 'none';
  },

  /* < Reconfigure analyse functions */

  addToRow(table, form, accesor, data) {
    const tds = table.querySelectorAll(`td[data-accessor='${accesor}']`);

    console.log('tds: ', tds);

    tds.forEach((td) => {
      let inner;
      td.dataset.tableValue === 'probability' && td.dataset.accessor === accesor
        ? (inner = data.probability)
        : (inner = data.cost);

      td.innerHTML = inner;
    });
  },

  createRow(table, form, accessor, data) {
    console.log('data: ', data);

    const tr = document.createElement('tr');
    let td;
    let text;
    let textValue;

    td = document.createElement('td');

    textValue = data.rule.name;
    text = document.createTextNode(textValue);
    td.appendChild(text);
    tr.appendChild(td);

    td = document.createElement('td');
    textValue = data.thing.title;
    text = document.createTextNode(textValue);
    td.appendChild(text);
    tr.appendChild(td);

    // Probability <td>
    td = document.createElement('td');
    td.dataset.tableValue = 'probability';
    td.dataset.accessor = accessor;

    textValue = data.probability;
    text = document.createTextNode(textValue);
    td.appendChild(text);

    tr.appendChild(td);

    // Cost <td>

    td = document.createElement('td');
    td.dataset.tableValue = 'cost';
    td.dataset.accessor = accessor;

    textValue = data.cost;
    text = document.createTextNode(textValue);

    td.appendChild(text);
    tr.appendChild(td);

    table.querySelector('tbody').appendChild(tr);
  },

  handleAnalyseCostProbability(table, form, costProb, rule, eventAction, value) {
    // boolean: created element in this.storedAnalyseRules
    const wasCreated = this.storeData(table, form, costProb, rule, eventAction, value);

    console.log('store data: ', this.storedAnalyseRules);

    let selected;
    const accesor = `${rule.value}-${eventAction.value}`;

    if (table.id === 'analyse-table-original') {
      selected = this.storedAnalyseRules.current[accesor];
      !wasCreated
        ? this.addToRow(table, form, accesor, selected)
        : this.createRow(table, form, accesor, selected);
    } else {
      selected = this.storedAnalyseRules.reconfigure[accesor];
      !wasCreated
        ? this.addToRow(table, form, accesor, selected)
        : this.createRow(table, form, accesor, selected);
    }
  },

  storeData(table, form, costProb, rule, eventAction, value) {
    const accesor = `${rule.value}-${eventAction.value}`;
    let created = false;
    let auxiliar;

    // check to what Composed to rule store
    if (table.id === 'analyse-table-original') {
      auxiliar = this.storedAnalyseRules.current[accesor];
    } else {
      auxiliar = this.storedAnalyseRules.reconfigure[accesor];
    }

    //  If element does not exist, it creates the element
    if (typeof auxiliar === 'undefined') {
      created = true;
      auxiliar = {};
      auxiliar.rule = { id: rule.value, name: rule.options[rule.selectedIndex].text };
      auxiliar.thing = {
        id: eventAction.value,
        title: eventAction.options[eventAction.selectedIndex].text,
      };
    }

    // Store in cost or probability
    if (costProb.value === 'cost') {
      auxiliar.cost = value.value;
    } else {
      auxiliar.probability = value.value;
    }

    // store data. This is in case undefined was found trying to retrive object
    if (table.id === 'analyse-table-original') {
      this.storedAnalyseRules.current[accesor] = auxiliar;
    } else {
      this.storedAnalyseRules.reconfigure[accesor] = auxiliar;
    }

    return created;
  },

  showAnalyseDiagram(bpmnXML) {
    // starts from zero in case node has any elements
    this.analyseCanvas.innerHTML = '';

    // !-- can be written in css (further refractor)
    this.analyseCanvas.style.display = 'flex';

    // creates an intance of BpmnJs
    this.bpmnView = new BpmnJS({
      container: this.analyseCanvas,
    });

    // I don't know what this does
    this.bpmnView.clear();

    // creates inside of the view of SVG
    this.bpmnView.importXML(bpmnXML, (err) => {
      if (err) {
        return console.error('could not import BPMN 2.0 diagram', err);
      }
      // access viewer components
      const canvas = this.bpmnView.get('canvas');
      // zoom to fit full viewport
      canvas.zoom('fit-viewport');
    });
  },

  handleAnalyseCSSVisuals: function () {
    // display modal: true
    this.analyseViewWrapper.classList.add('selected');
    this.analyseViewWrapper.style.display = 'flex';

    // display reconfigure section
    this.analyseView.style.display = 'block';
  },

  async handleAnalyseViewAccess(bpmnXMLs, composedRule) {
    // stores bpms xml for further usage
    this.analyseBpmnXMLs = bpmnXMLs;

    // get rules arrar (ex.[1, 2, 5]) from the composed rule expression
    const arrExp1 = composedRule.getRulesFromExpression();
    const arrExp2 = composedRule.getRulesFromExpression2();

    // gets and stores object definition of rules
    this.arrComposedRules = await this.getCompositionObject(arrExp1);
    this.arrReconfigureRules = await this.getCompositionObject(arrExp2);

    this.handleAnalyseView(this.analyseBpmnXMLs, 0);
  },

  /**
   *
   * @param {<BPMNxml>} bpmnXMLs
   * @param {<ComposedRule>} composedRule
   */
  handleAnalyseView(bpmnXML, stepToShow) {
    /*
        1. display none two forms
        2. display none two tables
        3. display flex <Form> from step
        4. display flex <Table> from step
    */

    const title = document.getElementById('analyse-modal-title');

    const originalForm = document.getElementById('analyse-original-form');
    const reconfigureForm = document.getElementById('analyse-reconfiguration-form');
    const tableOriginal = this.tableOriginal.parentNode;
    const tableReconfig = this.tableReconfig.parentNode;

    tableOriginal.style.display = 'none';
    tableReconfig.style.display = 'none';
    originalForm.style.display = 'none';
    reconfigureForm.style.display = 'none';

    // set step to show on modal
    this.analyseModalStepper = stepToShow;

    // handle modal view change
    switch (this.analyseModalStepper) {
      case 0: // shows first diagram & original form and table
        title.innerHTML = 'Current Configuration';
        this.showAnalyseDiagram(bpmnXML[0]);
        tableOriginal.style.display = 'table';
        originalForm.style.display = 'block';
        this.showDatasetTable2(this.tableOriginal, 'analyse-original-form', this.arrComposedRules);
        break;

      case 1: // shows second diagram & reconfigure form and table
        title.innerHTML = 'Reconfigure';
        this.showAnalyseDiagram(bpmnXML[1]);
        tableReconfig.style.display = 'table';
        reconfigureForm.style.display = 'block';
        this.showDatasetTable2(
          this.tableReconfig,
          'analyse-reconfiguration-form',
          this.arrReconfigureRules
        );
        break;
      // case 2: // shows dataset
      //   this.analyseTable.style.display = 'flex';
      //   this.showDatasetTable();
      //   break;
    }
  },

  showDatasetTable2(tableNode, formNode, arrComposedRules) {
    // remove rows in case of any excedent rows
    while (tableNode.firstChild) {
      tableNode.removeChild(tableNode.firstChild);
    }

    // creates rows for <Form>
    this.createAnalyseForm(formNode, arrComposedRules);
  },

  createAnalyseForm(idForm, ruleComposition) {
    // all input or selections of a form
    const ruleSelect = document.querySelector(`#${idForm} #rules-select`);
    const eventActionSelect = document.querySelector(`#${idForm} #event-action-select`);

    // appends rules and event/actions
    ruleComposition.forEach((rule) => {
      // option for rule
      const option = document.createElement('option');
      option.value = rule.id;
      option.text = rule.name;

      // IMPORTANT ! Add option to Rule <Select> nodes
      ruleSelect.appendChild(option);

      // opt group for events
      const optgroupEvents = document.createElement('optgroup');
      optgroupEvents.label = 'Events';
      optgroupActions.dataset.forRule = rule.id;

      // option for event / action
      rule.events.forEach((event) => {
        const eventOption = document.createElement('option');
        eventOption.value = event.id;
        eventOption.text = event.title;

        // set to what rule it belongs
        // eventOption.setAttribute('data-rule-belong') = rule.id;

        // IMPORTANT !! Add option to Thing <Select> node
        optgroupEvents.appendChild(eventOption);
      });

      // add optgroup for Events to select
      eventActionSelect.appendChild(optgroupEvents);

      // optgroup fot actions
      const optgroupActions = document.createElement('optgroup');
      optgroupActions.label = 'Actions';
      optgroupActions.dataset.forRule = rule.id;

      rule.actions.forEach((action) => {
        const actionOption = document.createElement('option');
        actionOption.value = action.id;
        actionOption.text = action.title;

        // set to what rule it belongs
        // actionOption.setAttribute('data-rule-belong') = rule.id;

        // IMPORTANT ! Add option to Thing <Select> node
        optgroupActions.appendChild(actionOption);
      });

      // add optgroup for Actions to select
      eventActionSelect.appendChild(optgroupActions);
    });
  },

  /**
   *
   * @param {<array>} rulesIDs array of ints of rules id's
   * @returns return Object Composition
   *
   * Object Composition:
   * [
   *  { id: ruleId, title: ruleTitle, events: [], actions: []},
   *  ... // other object
   * ]
   *
   * events Composition:
   * [
   *  {...}, // complete <Thing> Object
   *  ... // Another object
   * ]
   */
  async getCompositionObject(rulesIDs) {
    let composition = [];

    composition = await rulesIDs.reduce(async (accum, ruleID) => {
      // waits for the last callback to finish
      const requieredAcum = await accum;

      // object composition for <Rule>
      const unitRuleDescription = { id: ruleID, name: null, events: [], actions: [] };

      // wait for <Rule> description
      const rulePromise = await this.getRuleDescription(ruleID);

      // gets thing id's in <Rule> description
      const actionsIds = rulePromise.effect.effects; // actionsIds
      const eventIds = rulePromise.trigger.triggers; // eventIds

      // waits for <Thing> description
      const eventPromise = await this.getThings(eventIds); // waits within function
      const actionPromise = await this.getThings(actionsIds); // waits within function

      // sets name to composition
      unitRuleDescription.name = rulePromise.name;
      // sets actions & events to according composition object
      unitRuleDescription.events = eventPromise;
      unitRuleDescription.actions = actionPromise;

      // composition.push(unitRuleDescription);

      return [...requieredAcum, unitRuleDescription]; // specs for all unitRuleDescription
    }, []);

    return composition;
  },

  getRuleDescription(ruleId) {
    return fetch(`/rules/${ruleId}`, { headers: API.headers() })
      .then((response) => {
        return response.json();
      })
      .catch((err) => {
        console.log(`error en getRuleDescription(${ruleId}): `, err);
      });
  },

  async getThings(thingsIds) {
    return await thingsIds.reduce(async (accum, thing) => {
      const resultAcum = await accum; // awaits for last promises to resolve

      const response = await fetch(`/things/${thing.property.thing}`, { headers: API.headers() });
      const thingJson = await response.json();

      return [...resultAcum, thingJson];
    }, []);
  },

  /* </ Reconfigure analyse functions */

  hideMclDialog() {
    this.mclDialog.style.display = 'none';
  },
  showMclDialog: function () {
    this.diagramView.classList.add('selected');
    this.diagramView.style.display = 'flex';
    this.hiddeDiagram();
    this.hiddeVerification();
    this.mclDialog.style.display = 'block';
  },
  requestDiagram: function () {
    const fetchOptions = {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/xml',
      },
      redirect: 'follow',
      referrer: 'no-referrer',
      body: JSON.stringify(this.cRule.getBpmnDescription(this.fetchedRules)),
    };
    // 10.138.2.9:8080
    this.showLoader();
    fetch('http://localhost:9001/workflow', fetchOptions).then((res) => {
      // console.log(res);
      res.text().then((text) => {
        this.hiddeLoader();
        this.showDiagram(text);
      });
    });
    // ;
  },
  requestExecution: function () {
    this.showLoader();
    fetch('/composed-rules/deploy/1', { headers: API.headers() }).then((_response) => {
      this.hiddeLoader();
    });
  },
  requestVerify: function (_cRule) {
    fetch(`/rules`, { headers: API.headers() })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        this.showLoader();
        const info = {};
        info.expression = this.cRule.expression;
        info.objects = [];
        info.rules = [];

        const usedRules = [];
        const usedObjects = {};
        // get te used rules
        res.forEach((rule) => {
          if (this.cRule.rules.includes(`${rule.id}`)) {
            usedRules.push(rule);
          }
        });
        //
        usedRules.forEach((rule) => {
          const tempRule = {};
          tempRule.id = rule.id.toString();
          tempRule.type = rule.trigger.op;
          tempRule.events = [];
          tempRule.actions = [];
          rule.trigger.triggers.forEach((trigger) => {
            if (trigger.property) {
              tempRule.actions.push(`${trigger.property.thing}|${trigger.property.id}`);
              usedObjects[trigger.property.thing] = true;
            } else {
              tempRule.actions.push(`${trigger.type}|${Object.keys(trigger)[1]}`);
              usedObjects[trigger.type] = true;
            }
          });
          rule.effect.effects.forEach((effect) => {
            if (effect.property) {
              tempRule.events.push(`${effect.property.thing}|${effect.property.id}`);
              usedObjects[effect.property.thing] = true;
            } else {
              tempRule.events.push(`${effect.type}|${Object.keys(effect)[1]}`);
              usedObjects[effect.type] = true;
            }
          });
          info.rules.push(tempRule);
        });

        info.objects = Object.keys(usedObjects);
        // console.log('final info ', info);
        return info;
      })
      .then((info) => {
        return fetch('/composed-rules/things', { headers: API.headers() })
          .then((res) => {
            return res.json();
          })
          .then((things) => {
            info.fullThings = things;
            return info;
          });
      })
      .then((info) => {
        const fetchOptions = {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          redirect: 'follow',
          referrer: 'no-referrer',
          body: JSON.stringify(info),
        };
        fetch('http://localhost:9001/verify', fetchOptions)
          .then((res) => {
            return res.json();
          })
          .then((data) => {
            console.log('verification data');
            console.log(data);
            this.showVerification(data);
            this.hiddeLoader();
          });
      });
  },
  requestMcl: function (_cRule) {
    fetch(`/rules`, { headers: API.headers() })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        this.hideMclDialog();
        this.showLoader();
        const info = {};
        info.expression = this.cRule.expression;
        info.objects = [];
        info.rules = [];
        info.formula = this.mclFormula.value;

        const usedRules = [];
        const usedObjects = {};
        // get te used rules
        res.forEach((rule) => {
          if (this.cRule.rules.includes(`${rule.id}`)) {
            usedRules.push(rule);
          }
        });
        //
        usedRules.forEach((rule) => {
          const tempRule = {};
          tempRule.id = rule.id.toString();
          tempRule.type = rule.trigger.op;
          tempRule.events = [];
          tempRule.actions = [];
          rule.trigger.triggers.forEach((trigger) => {
            if (trigger.property) {
              tempRule.actions.push(`${trigger.property.thing}|${trigger.property.id}`);
              usedObjects[trigger.property.thing] = true;
            } else {
              tempRule.actions.push(`${trigger.type}|${Object.keys(trigger)[1]}`);
              usedObjects[trigger.type] = true;
            }
          });
          rule.effect.effects.forEach((effect) => {
            if (effect.property) {
              tempRule.events.push(`${effect.property.thing}|${effect.property.id}`);
              usedObjects[effect.property.thing] = true;
            } else {
              tempRule.events.push(`${effect.type}|${Object.keys(effect)[1]}`);
              usedObjects[effect.type] = true;
            }
          });
          info.rules.push(tempRule);
        });

        info.objects = Object.keys(usedObjects);
        // console.log('final info ', info);
        return info;
      })
      .then((info) => {
        return fetch('/composed-rules/things', { headers: API.headers() })
          .then((res) => {
            return res.json();
          })
          .then((things) => {
            info.fullThings = things;
            return info;
          });
      })
      .then((info) => {
        const fetchOptions = {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          redirect: 'follow',
          referrer: 'no-referrer',
          body: JSON.stringify(info),
        };
        fetch('http://localhost:9001/mcl', fetchOptions)
          .then((res) => {
            return res.json();
          })
          .then((data) => {
            this.showVerification(data);
            this.hiddeLoader();
          });
      });
  },
  deployRule() {
    this.requestExecution();
  },
  show: function (composedRuleId) {
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
    rulePromise.then((ruleDesc) => {
      if (this.ComposedRuleBlocks.length <= 0) {
        this.cRule = new VscadComposedRule(this.gateway, ruleDesc);
        this.cRule.update();
        this.prepareVisual(this.cRule.toDescription(), this.gateway, this.fetchedRules);
      }
    });
  },
  /**
   * @return {Promise<Array<RuleDescription>>}
   */
  readRules: function readRules() {
    const createRuleButton = document.createElement('div');
    createRuleButton.innerHTML = `<div class="rule-part-block trigger">
      <img  src="/images/add.svg">
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
    return fetch('/rules', { headers: API.headers() })
      .then((res) => {
        return res.json();
      })
      .then((fetchedRules) => {
        this.rulesList.querySelectorAll('.rule').forEach((elt) => {
          elt.parentNode.removeChild(elt);
        });
        this.rulesList.appendChild(createRuleButton);
        for (const ruleDesc of fetchedRules) {
          this.addVscadRuleCardItem(ruleDesc);
        }
        this.fetchedRules = fetchedRules;
        console.log(this.ComposedRuleBlocks.length <= 0);
        if (this.ComposedRuleBlocks.length <= 0) {
          this.prepareVisual(this.cRule.toDescription(), this.gateway, this.fetchedRules);
        }
      })
      .finally(() => {
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
  saveRule: function () {
    let longest = '';
    let foundRules = 0;
    for (let i = this.ComposedRuleBlocks.length - 1; i >= 0; i--) {
      const block = this.ComposedRuleBlocks[i];
      if (block && block.role === '') {
        longest = block.getText();
        foundRules++;
      } else if (block.role === 'removed') {
        this.ComposedRuleBlocks.splice(i, 1);
      }
    }
    document.getElementById('warning-message').style.display = foundRules > 1 ? 'block' : 'none';
    console.log(longest);
    this.cRule.setExpression(longest);
    this.cRule.setRules(this.cRule.getRulesFromExpression());
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
  getBlockOf: function (parts, usedRules) {
    let i = 0;
    const block = new VscadConnectorBlock(this.ruleArea, this.saveRule, this.deleteArea);

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
        const newBlock = new VscadRulePropertyBlock(
          this.ruleArea,
          ruleDesc,
          this.saveRule,
          this.deleteArea
        );
        newBlock.text = ruleDesc.id;
        block.addAsChild(newBlock);
      }
      i++;
    }

    return block;
  },
  onDeviceBlockDown: function (event, desc, _gateway) {
    const deviceRect = event.target.getBoundingClientRect();
    const x = deviceRect.left;
    const y = deviceRect.top;
    const newBlock = new VscadRulePropertyBlock(
      this.ruleArea,
      desc,
      this.saveRule,
      this.deleteArea
    );
    newBlock.text = desc.id;
    newBlock.snapToGrid(x, y);
    newBlock.vscadDraggable.onDown(event);
    this.ComposedRuleBlocks.push(newBlock);
  },
};

module.exports = VscadRulesScreen;
