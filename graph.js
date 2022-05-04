
/**********************************/
/********** Graph Logic  **********/
/**********************************/

class PersonaGraph {
  constructor(customPersonaeByArcana, personaMap) {
    this.calc = new FusionCalculator(customPersonaeByArcana);
    this.listOfPersonas = Object.keys(personaMap);
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
    }
  
    this.depsGraph[personaName] = graphObj;
  
    for (let key in fusionToRecipes) {
      const recipe = fusionToRecipes[key];
      
  
      const _deps = recipe.sources.map(source => source.name);
      _deps.sort();
  
      const _name = _deps.join(' + ');
  
      graphObj._deps.push(_name);
      this.depsGraph[_name] = {
        _deps,
        _name,
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
  constructor (selectorString) {
    this.graph = new PersonaGraph(customPersonaeByArcana, personaMap);
    this.upstream = this.graph.upstream;
    this.downstream = this.graph.downstream;
    this.selectorString = selectorString;
    this.numPaths = 0;
  }

  dfs(startingPersona, targetPersona, numFusions) {
    this.reset();

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
      this.tree = new DependenTree(this.selectorString);
      this.tree.addEntities([{_name: 'a'}]);
      this.tree.downstream = { [startingPersona]: this.newDownstream };
      this.tree.setTree(startingPersona, 'downstream');
    } else {
      alert('No fusion paths found. Try increasing the max number of fusions.');
    }

    return {
      time: this.searchTime,
      numPaths: this.numPaths,
    }
  }


  reset() {
    this.numPaths = 0;
    if (!this.tree) return;
    this.tree.passedContainerEl.innerHTML = '';
  }
  
  cloneNode(node) {
    return {
      ...node,
      _deps: [],
    }
  }

  recurse(node, target, depth = 4, path = '') {
    path += " => " + node._name;
  
    const clone = this.cloneNode(node);
  
    if (node._name === target) {
      this.numPaths++;
      return clone;
    }
  
    if (depth === 0) {
      return false;
    }
  
    node._deps.forEach(dep => {
      const childClone = this.recurse(dep, target, depth - 1, path);
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

  const d = new PersonaDFS('div#tree');
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

function generateCustomPersonaeByArcana() {
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

function generatePersonaList() {
  customPersonaList = generateCustomPersonaList();
  personaeByArcana = generateCustomPersonaeByArcana();
}
