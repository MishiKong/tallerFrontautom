document.getElementById('generate-btn').addEventListener('click', drawAutomata);
document.getElementById('validate-btn').addEventListener('click', validateString);
document.getElementById('manual-mode-btn').addEventListener('click', enableManualMode);
document.getElementById('add-transition-btn').addEventListener('click', addTransition);

let automaton = {};
let isManualMode = false;
let manualStates = [];
let manualTransitions = [];

function drawAutomata() {
    const container = document.getElementById('automata-container');
    container.innerHTML = '';

    const states = document.getElementById('input-states').value.split(',');
    const initialState = document.getElementById('input-initial-state').value.trim();
    const finalStates = document.getElementById('input-final-states').value.split(',');
    const transitions = document.getElementById('input-transitions').value.split(';');

    automaton = {
        states,
        initialState,
        finalStates,
        transitions: {}
    };

    const centerX = container.offsetWidth / 2;
    const centerY = container.offsetHeight / 2;
    const radius = Math.min(centerX, centerY) - 100;

    const positions = {};

    states.forEach((state, index) => {
        const angle = (index / states.length) * 2 * Math.PI;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        const stateElement = document.createElement('div');
        stateElement.className = 'state';
        if (state === initialState) stateElement.classList.add('initial');
        if (finalStates.includes(state)) stateElement.classList.add('final');
        stateElement.style.left = `${x}px`;
        stateElement.style.top = `${y}px`;
        stateElement.innerText = state;
        container.appendChild(stateElement);

        positions[state] = { x: x + 35, y: y + 35 };
    });

    transitions.forEach(transition => {
        const [from, symbol, to] = transition.split(',');
        if (!automaton.transitions[from]) automaton.transitions[from] = {};
        automaton.transitions[from][symbol] = to;

        drawArrow(positions[from], positions[to], symbol.trim(), container);
    });
}

function drawArrow(fromPos, toPos, label, container) {
    const line = document.createElement('div');
    line.className = 'transition-label';
    line.style.left = `${(fromPos.x + toPos.x) / 2}px`;
    line.style.top = `${(fromPos.y + toPos.y) / 2}px`;
    line.innerText = label;
    container.appendChild(line);
}

function validateString() {
    const inputString = document.getElementById('input-string').value.trim();
    let currentState = automaton.initialState;
    const resultElement = document.getElementById('validation-result');

    for (const symbol of inputString) {
        if (automaton.transitions[currentState] && automaton.transitions[currentState][symbol]) {
            currentState = automaton.transitions[currentState][symbol];
        } else {
            resultElement.innerText = 'Cadena rechazada ❌';
            resultElement.className = 'rejected';
            return;
        }
    }

    if (automaton.finalStates.includes(currentState)) {
        resultElement.innerText = 'Cadena aceptada ✔️';
        resultElement.className = 'accepted';
    } else {
        resultElement.innerText = 'Cadena rechazada ❌';
        resultElement.className = 'rejected';
    }
}

function enableManualMode() {
    isManualMode = !isManualMode;
    manualStates = [];
    manualTransitions = [];
    document.getElementById('automata-container').innerHTML = ''; 
    document.getElementById('generated-data').style.display = isManualMode ? 'block' : 'none';
}

document.getElementById('automata-container').addEventListener('click', (e) => {
    if (isManualMode) {
        const x = e.offsetX;
        const y = e.offsetY;

        const stateName = `q${manualStates.length}`;
        manualStates.push({ name: stateName, x, y });

        const stateElement = document.createElement('div');
        stateElement.className = 'state';
        stateElement.draggable = true;
        stateElement.style.left = `${x - 35}px`;
        stateElement.style.top = `${y - 35}px`;
        stateElement.innerText = stateName;

        stateElement.addEventListener('dragstart', (e) => onDragStart(e, stateElement));
        stateElement.addEventListener('dragend', (e) => onDragEnd(e, stateElement));

        document.getElementById('automata-container').appendChild(stateElement);

        updateGeneratedData();
    }
});

function addTransition() {
    const fromState = document.getElementById('from-state').value.trim();
    const symbol = document.getElementById('symbol').value.trim();
    const toState = document.getElementById('to-state').value.trim();

    if (!fromState || !symbol || !toState) {
        alert("Por favor, ingresa todos los campos de la transición.");
        return;
    }

    manualTransitions.push({ from: fromState, to: toState, symbol });

    const fromPos = manualStates.find(state => state.name === fromState);
    const toPos = manualStates.find(state => state.name === toState);

    if (fromPos && toPos) {
        drawArrow(fromPos, toPos, symbol, document.getElementById('automata-container'));
    }

    updateGeneratedData();
}

function onDragStart(e, stateElement) {
    stateElement.style.opacity = '0.5';
}

function onDragEnd(e, stateElement) {
    stateElement.style.opacity = '1';

    const rect = stateElement.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const stateName = stateElement.innerText;
    const state = manualStates.find(s => s.name === stateName);
    state.x = x;
    state.y = y;

    updateGeneratedData();
}

function updateGeneratedData() {
    document.getElementById('generated-states').innerText = `Estados: ${manualStates.map(s => s.name).join(', ')}`;
    document.getElementById('generated-transitions').innerText = `Transiciones: ${manualTransitions.map(t => `${t.from},${t.symbol},${t.to}`).join('; ')}`;
    document.getElementById('generated-initial-state').innerText = `Estado inicial: ${manualStates[0]?.name || ''}`;
    document.getElementById('generated-final-states').innerText = `Estados finales: (Haz clic en un estado y selecciona si es final)`;
}
