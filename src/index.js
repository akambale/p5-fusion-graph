/****************** HTML Constants ******************/
const numFusions = document.querySelector('#numFusions');
const select1 = document.getElementById('p1');
const select2 = document.getElementById('p2');
const mainForm = document.querySelector('form#main');
const stats = document.getElementById('stats');
const timeEl = document.querySelector('div#time > span');
const paths = document.querySelector('div#num-paths > span');
const fieldset = document.querySelector('fieldset');
const dlcForm = document.querySelector('#dlc-form');
const dlcFormBtn = document.getElementById('dlc-form-button');
const load = document.getElementById('load');
const searchBtn = document.getElementById('search');
const treeEl = document.querySelector('div#tree');

new SlimSelect({
  select: select1,
  placeholder: 'Select a Persona you have'
});

new SlimSelect({
  select: select2,
  placeholder: 'Select the Persona you want to fuse'
});

new SlimSelect({
  select: numFusions,
  placeholder: 'Max number of fusions'
});


/********* Initial State from localStorage **********/
if (!localStorage.getItem('dlcPersona')) localStorage.setItem('dlcPersona', '{}');
if (!localStorage.getItem('royal')) localStorage.setItem('royal', true);


/********************* Globals **********************/
let isRoyal = JSON.parse(localStorage.getItem('royal'));
let personaDfs = makeGraph(customPersonaeByArcana);

const rarePersonaeVanilla = rarePersonae;
const rareCombosVanilla = rareCombos;
const arcana2CombosVanilla = arcana2Combos;
const specialCombosVanilla = specialCombos;
const dlcPersonaVanilla = dlcPersona;
const personaMapVanilla = personaMap;
const skillMapVanilla = skillMap;


/********************* Init App **********************/
swapGame();
setDlcForm();
personaDfs = makeGraph(customPersonaeByArcana);

document.getElementsByName('version')[isRoyal ? 1 : 0].checked = true;

/********************* Event Listeners **********************/

dlcForm.addEventListener('change', (e) => {
  const { value, checked, type } = e.target;
  if (type === 'checkbox') {
    const [p1, p2] = value.split(" and ");
    const obj = JSON.parse(localStorage.dlcPersona)
    obj[p1] = checked;
    obj[p2] = checked;
    obj[value] = checked;
    localStorage.setItem('dlcPersona', JSON.stringify(obj));
  } else if (type === 'radio') {
    isRoyal = value === 'royal'
    swapGame();
    localStorage.setItem('royal', isRoyal);
  }

  personaDfs = makeGraph(customPersonaeByArcana);
});


dlcFormBtn.addEventListener('click', function toggleDlcForm() {
  if (dlcForm.style.display === 'none') {
    dlcForm.style.display = 'block';
  } else {
    dlcForm.style.display = 'none';
  }
});


searchBtn.addEventListener('click', function search() {
  const start = select1.value;
  const end = select2.value;
  const depth = numFusions.value;
  if (!start || !end || !depth) {
    alert('Fill all the form fields')
    return;
  }
  toggleGif();
  treeEl.innerHTML = '';
  setTimeout(() => { 
    const { time, numPaths } = personaDfs.dfs(start, end, depth);
    toggleGif();
    timeEl.innerText = time;
    paths.innerText = formatNum(numPaths);
    stats.style.display = 'flex';
  }, 50);
});

/**********************************/
/********** Form Logic  ***********/
/**********************************/

function swapGame() {
  const text = `Persona 5 ${isRoyal ? 'Royal ' : ''}Graph`;
  document.title = text;
  document.querySelector('h1').innerText = text;

  if (isRoyal) {
    rarePersonae = rarePersonaeRoyal;
    rareCombos = rareCombosRoyal;
    arcana2Combos = arcana2CombosRoyal;
    specialCombos = specialCombosRoyal;
    dlcPersona = dlcPersonaRoyal;
    personaMap = personaMapRoyal;
    skillMap = skillMapRoyal;
  } else {
    rarePersonae = rarePersonaeVanilla;
    rareCombos = rareCombosVanilla;
    arcana2Combos = arcana2CombosVanilla;
    specialCombos = specialCombosVanilla;
    dlcPersona = dlcPersonaVanilla;
    personaMap = personaMapVanilla;
    skillMap = skillMapVanilla;
  }

  setDlcForm();
}

function setDlcForm() {
  const dlcObj = JSON.parse(localStorage.getItem('dlcPersona'));

  const str = dlcPersona.reduce((acc, arr) => {
    const list = arr.join(' and ');
    const checked = dlcObj[list] ? 'checked' : '';
    return acc + `
      <div class="check-group">
        <input type="checkbox" value="${list}" name="${list}" id="check-${list}" ${checked}>
        <label for="check-${list}">${list}</label>
      </div>
    `;
  }, '');

  fieldset.innerHTML = str;
}

function toggleGif() {
  if (load.style.display === 'none') {
    load.style.display = 'block';
  } else {
    load.style.display = 'none';
  }
}

function formatNum(num) {
  num = num.toString();
  num = num.split('').reverse().join('')
  let str = '';
  for (let i =0; i < num.length; i++) {
    if (i % 3 === 0 && i < num.length) str += ',';
    const char = num[i];
    str += char;
  }

  return str.slice(1).split('').reverse('').join('');
}
