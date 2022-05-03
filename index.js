const formatCurrency = (num) => {
  if (num == 0) return '¥ 0';
  num = num.toString();
  num = num.split('').reverse().join('')
  let str = '';
  for (let i =0; i < num.length; i++) {
    const char = num[i];
    str += char;
    if ((i + 1) % 3 === 0) str += ',';
  }

  return `¥ ${str.split('').reverse('').join('').slice(1)}`;
}

const calc = new FusionCalculator(customPersonaeByArcana);

const listOfPersonas = Object.keys(personaMap);

const graph = {}

listOfPersonas.forEach(personaName => {
  const persona = personaMap[personaName]
  const fusionToRecipes = calc.getRecipes(persona);

  const graphObj = {
    _name: personaName,
    _deps: [],
    _cost: 0,
    _totalCost: 0,
    Cost: formatCurrency(0),
  }

  graph[personaName] = graphObj;

  for (let key in fusionToRecipes) {
    const recipe = fusionToRecipes[key];

    const _deps = recipe.sources.map(source => source.name);
    _deps.sort();

    const _name = _deps.join(' + ');

    graphObj._deps.push(_name);
    graph[_name] = {
      _deps,
      _name,
      _cost: recipe.cost,
      Cost: formatCurrency(recipe.cost),
    };
  }
});

const t = new DependenTree('div#test');

t.addEntities(graph);

const { upstream, downstream } = t;

// t.setTree('Abaddon');


const cloner = (node, parent) => {
  const obj = {
    ...node,
    _deps: [],
    _totalCost: this._cost + parent._cost,
    Cost: 0, //formatCurrency(recipe.cost),
    'Total Cost': formatCurrency(this._totalCost || 0),
  }

  return obj;
}

const results = [];

const recurse = (node, target, depth = 4, path = '', parent = node) => {
  path += " => " + node._name;

  const clone = cloner(node, parent);

  if (node._name === target) {
    results.push(path);
    return clone;
  }

  if (depth === 0) {
    return false;
  }

  node._deps.forEach(dep => {
    const childClone = recurse(dep, target, depth - 1, path, node);
    if (childClone) {
      clone._deps.push(childClone);
    }
  });

  return clone._deps.length ? clone : false; 
}


const a = performance.now();

// starting point, target
const newDownstream = recurse(downstream.Abaddon, 'King Frost');
const b = performance.now();


console.log(b - a, 'milliseconds');
console.log((b - a) / 1000, 'seconds');


const tree = new DependenTree('div#tree');
tree.addEntities([{_name: 'a'}]);
tree.downstream = { Abaddon: newDownstream };
tree.setTree('Abaddon', 'downstream');