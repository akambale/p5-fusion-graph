const calc = new FusionCalculator(customPersonaeByArcana);

// console.log(calc.getAllResultingRecipesFrom(personaMap.Abaddon));

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

const t = new DependenTree('div', { maxDepth: 11 });

t.addEntities(graph);

const { upstream, downstream } = t;

// t.setTree('Abaddon');



const results = [];

const recurse = (node, target, depth = 4, path = '') => {
  path += " => " + node._name;
  if (node._name === target) {
    // console.log(path);
    results.push(path);
    return;
  }

  if (depth === 0) {
    return;
  }

  node._deps.forEach(dep => {
    recurse(dep, target, depth - 1, path);
  });

}


const a = performance.now();

// starting point, target
recurse(downstream.Abaddon, 'King Frost', 6);
const b = performance.now();

// results.forEach(console.log.bind(this))

console.log(b - a, 'milliseconds');
console.log((b - a) / 1000, 'seconds');
// console.log(upstream.Arsene._deps)
// console.log(downstream.Arsene._deps)