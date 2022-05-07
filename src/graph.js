/**********************************/
/********** Graph Logic  **********/
/**********************************/

class PersonaGraph {
  constructor(myPersonaeByArcana) {
    this.calc = new FusionCalculator(myPersonaeByArcana);
    this.listOfPersonas = customPersonaList.map(p => p.name);
    this.depsGraph = {};

    this.listOfPersonas.forEach(this.populateDeps.bind(this));
    this.populateGraph();
  }

  // Creates a graph linking persona's together with 
  // an inbetween node with a "+" in it
  populateDeps(personaName) {
    const persona = personaMap[personaName];
    const fusionToRecipes = this.calc.getRecipes(persona);
  
    const graphObj = {
      _name: personaName,
      _deps: [],
      Level: persona.level,
      _link: `https://chinhodado.github.io/persona5_calculator/index${isRoyal ? 'Royal' : ''}.html#/persona/${personaName}`,
    }
  
    this.depsGraph[personaName] = graphObj;
  
    for (let key in fusionToRecipes) {
      const recipe = fusionToRecipes[key];
  
      recipe.sources.sort((p1, p2) => p1.level - p2.level);
      const _deps = recipe.sources.map(source => source.name);

      const _name = _deps.join(' + ');
      const lowest = recipe.sources[0]
      const highest = recipe.sources[recipe.sources.length - 1]
  
      graphObj._deps.push(_name);
      this.depsGraph[_name] = {
        Cost: `¥${formatNum(recipe.cost)}`,
        _cost: recipe.cost,
        _deps,
        _name,
        _avg: (highest.level + lowest.level) / 2,
        'Lowest Level Persona': `${lowest.name}, Level ${lowest.level}`,
        'Highest Level Persona':`${highest.name}, Level ${highest.level}`,
      };
    }
  }

  populateGraph() {
    // Using DependenTree for the graph mapping logic not
    // actually visualizing this graph because it is far
    // too connected to provide valuable data to the user.
    // maxDepth cuts off too much and there can be too many 
    // fusion recipes on any given persona, this makes too
    // much noise. There is already a lot of noise as is
    // with the fusion recipes that do lead to the target.
    this.tree = new DependenTree('div#test');
    this.tree.addEntities(this.depsGraph);
    this.upstream = this.tree.upstream;
    this.downstream = this.tree.downstream;
    return { upstream: this.upstream, downstream: this.downstream }
  }
}

class PersonaDFS {
  constructor (selectorString, myPersonaeByArcana) {
    this.graph = new PersonaGraph(myPersonaeByArcana, personaMap);
    this.upstream = this.graph.upstream;
    this.downstream = this.graph.downstream;
    this.selectorString = selectorString;
    this.numPaths = 0;
  }

  dfs(startingPersona, targetPersona, numFusions) {
    this.numPaths = 0;

    const depth = numFusions * 2;
    
    const startTime = performance.now();
 
    this.newDownstream = this.recurse(this.downstream[startingPersona], targetPersona, depth);
    const endTime = performance.now();
    this.searchTime = ((endTime - startTime) / 1000).toFixed(2);


    // This section hacks the DependenTree code and injects a
    // phony graph of our own creation. DependenTree, thinking
    // that "downstream" is it's own graph, will create a a tree
    // based on this given structure. We're not using DependenTree
    // for exactly for its intended purpose, but that's fine. The
    // d3 code it abstracts away is plenty useful as is.
    if (this.newDownstream) {  
      this.tree = new DependenTree(this.selectorString, {
        textClick ,
        horizontalSpaceBetweenNodes: 200,
        verticalSpaceBetweenNodes: 50,
        circleStrokeColor: '#ff0505',
        closedNodeCircleColor	: 'white',
        openNodeCircleColor: 'black',
        textStyleColor: 'white',
        linkStrokeColor: '#ff0505',
        tooltipStyleObj: {
          border: 'solid',
          'border-width': '1px',
          'border-radius': '5px',
          padding: '10px'
        }
      });
      this.tree.addEntities([{_name: 'a'}]);
      this.tree.downstream = { [startingPersona]: this.newDownstream };
      this.recursiveSort(this.newDownstream);
      this.tree.setTree(startingPersona, 'downstream');
    } else {
      alert('No fusion paths found. Try increasing the max number of fusions.');
    }

    return {
      time: this.searchTime,
      numPaths: this.numPaths,
    }
  }
  
  recursiveSort(node) {
    node._deps.sort((a, b) => {
      return a._avg - b._avg;
    });
    node._deps.forEach(this.recursiveSort.bind(this));
  }
  
  cloneNode(node) {
    return {
      ...node,
      _deps: [],
    }
  }

  recurse(node, target, depth = 4, cumCost = 0) {  
    const clone = this.cloneNode(node);
  
    if (node._name === target) {
      this.numPaths++;
      clone['Total Cost'] = `¥${formatNum(cumCost)}`;
      return clone;
    }
  
    if (depth === 0) {
      return false;
    }

    const newCost = node._cost ? node._cost + cumCost : cumCost
  
    node._deps.forEach(dep => {
      const childClone = this.recurse(dep, target, depth - 1, newCost);
      if (childClone) {
        clone._deps.push(childClone);
      }
    });
  
    return clone._deps.length ? clone : false; 
  }
}

function makeGraph() {
  generatePersonaList();

  select1.innerHTML = '<option data-placeholder="true"></option>';
  select2.innerHTML = '<option data-placeholder="true"></option>';

  const d = new PersonaDFS('div#tree', customPersonaeByArcana);
  d.graph.listOfPersonas.forEach(p => {
    const option = document.createElement('option');
    option.innerText = p;
    option.value = p;
    const clone = option.cloneNode();
    clone.innerText = p;

    select1.append(option);
    select2.append(clone);
  });

  return d;
}

function generateCustomPersonaList() {
  var arr = [];
  for (var key in personaMap) {
      if (personaMap.hasOwnProperty(key)) {
          var persona = personaMap[key];
          if (persona.dlc && !isDlcPersonaOwned(key)) {
              continue;
          }
          persona.name = key;
          addStatProperties(persona);
          addElementProperties(persona);
          arr.push(persona);
      }
  }
  return arr;
};

function generateCustomPersonaeByArcana(customPersonaList) {
  var personaeByArcana_ = {};
  for (var i = 0; i < customPersonaList.length; i++) {
      var persona = customPersonaList[i];
      if (!personaeByArcana_[persona.arcana]) {
          personaeByArcana_[persona.arcana] = [];
      }
      personaeByArcana_[persona.arcana].push(persona);
  }
  for (var key in personaeByArcana_) {
      personaeByArcana_[key].sort(function (a, b) { return a.level - b.level; });
  }
  // Make sure this is always there regardless of DLC setting
  if (!personaeByArcana_['World']) {
      personaeByArcana_['World'] = [];
  }
  return personaeByArcana_;
}

function generateArcanaMap() {
  const map = {};
  for (var i = 0; i < arcana2Combos.length; i++) {
      const combo = arcana2Combos[i];
      if (!map[combo.source[0]])
          map[combo.source[0]] = {};
      map[combo.source[0]][combo.source[1]] = combo.result;
      if (!map[combo.source[1]])
          map[combo.source[1]] = {};
      map[combo.source[1]][combo.source[0]] = combo.result;
  }
  return map;
};

function generatePersonaList() {
  customPersonaList = generateCustomPersonaList();
  customPersonaeByArcana = generateCustomPersonaeByArcana(customPersonaList);
  arcanaMap = generateArcanaMap();
}


const textClick = (event, nodeData) => {
  const _link = nodeData._link;
  if (!_link) return;
  window.open(_link, '_blank');
};
