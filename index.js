const calc = new FusionCalculator(customPersonaeByArcana);

const listOfPersonas = Object.keys(personaMap);

const graph = {}

listOfPersonas.forEach(personaName => {
  const persona = personaMap[personaName]
  const fusionToRecipes = calc.getRecipes(persona);

  const graphObj = {
    _name: personaName,
    _deps: [],
  }

  graph[personaName] = graphObj;

  for (let key in fusionToRecipes) {
    const recipe = fusionToRecipes[key];
    
    const _deps = [recipe.sources[0].name, recipe.sources[1].name];
    _deps.sort();
    const _name = _deps.join(' + ');

    graphObj._deps.push(_name);
    graph[_name] = {
      _deps,
      _name,
      cost: recipe.cost,
    };
  }

  // console.log(typeof fusionToRecipes);
});

const t = new DependenTree('.foo', { maxDepth: 11 });

t.addEntities(graph);

const g = t.upstream;

// t.setTree('Abaddon');

'Abaddon => King Frost';

// search through abbadon's deps
  // if any of those strings have a match, continue
    // find the one


    //max depth or this will continue forever.