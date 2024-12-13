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
    const svg = container.querySelector('#automata-svg');
    svg.innerHTML = ''; // Limpiar SVG anterior

    // Agregar definición de marcador de flecha
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '0');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', '#ff4081');
    
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);

    const states = document.getElementById('input-states').value.split(',');
    const initialState = document.getElementById('input-initial-state').value.trim();
    const finalStates = document.getElementById('input-final-states').value.split(',');
    const transitions = document.getElementById('input-transitions').value.split(';');

    // Validar entradas
    if (!states.every(state => state.trim()) || !initialState || !finalStates.every(state => state.trim())) {
        alert('Por favor, complete todos los campos correctamente');
        return;
    }

    automaton = {
        states,
        initialState,
        finalStates,
        transitions: {}
    };

    const svgWidth = svg.clientWidth;
    const svgHeight = svg.clientHeight;
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;
    const radius = Math.min(centerX, centerY) - 100;

    const positions = {};

    // Dibujar estados
    states.forEach((state, index) => {
        const angle = (index / states.length) * 2 * Math.PI;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        // Crear círculo de estado
        const stateCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        stateCircle.setAttribute('cx', x);
        stateCircle.setAttribute('cy', y);
        stateCircle.setAttribute('r', '35');
        stateCircle.setAttribute('fill', 'url(#stateGradient)');
        stateCircle.setAttribute('stroke', 'white');
        stateCircle.setAttribute('stroke-width', '3');

        // Texto del estado
        const stateText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        stateText.setAttribute('x', x);
        stateText.setAttribute('y', y);
        stateText.setAttribute('text-anchor', 'middle');
        stateText.setAttribute('dy', '5');
        stateText.setAttribute('fill', 'white');
        stateText.setAttribute('font-weight', 'bold');
        stateText.textContent = state;

        // Marcar estado inicial
        if (state === initialState) {
            const arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
            arrow.setAttribute('d', `M ${x - 50} ${y} L ${x - 35} ${y}`);
            arrow.setAttribute('stroke', 'white');
            arrow.setAttribute('stroke-width', '2');
            arrow.setAttribute('marker-end', 'url(#arrowhead)');
            svg.appendChild(arrow);
        }

        // Marcar estados finales
        if (finalStates.includes(state)) {
            stateCircle.setAttribute('stroke-dasharray', '5,5');
        }

        svg.appendChild(stateCircle);
        svg.appendChild(stateText);

        positions[state] = { x, y };
    });

    // Dibujar transiciones
    transitions.forEach(transition => {
        const [from, symbol, to] = transition.split(',');
        if (!automaton.transitions[from]) automaton.transitions[from] = {};
        automaton.transitions[from][symbol] = to;

        drawArrow(positions[from], positions[to], symbol.trim(), container);
    });
}

function drawArrow(fromPos, toPos, label, container) {
    const svg = container.querySelector('#automata-svg');
    
    // Calcular la dirección de la flecha
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx*dx + dy*dy);

    // Ajustar puntos para no tocar directamente los estados
    const startX = fromPos.x + Math.cos(angle) * 35;
    const startY = fromPos.y + Math.sin(angle) * 35;
    const endX = toPos.x - Math.cos(angle) * 35;
    const endY = toPos.y - Math.sin(angle) * 35;

    // Crear línea
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute('x1', startX);
    line.setAttribute('y1', startY);
    line.setAttribute('x2', endX);
    line.setAttribute('y2', endY);
    line.setAttribute('stroke', '#ff4081');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('marker-end', 'url(#arrowhead)');

    // Crear texto de transición
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute('x', (startX + endX) / 2);
    text.setAttribute('y', (startY + endY) / 2);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#ff4081');
    text.setAttribute('font-size', '12');
    text.textContent = label;

    svg.appendChild(line);
    svg.appendChild(text);
}

function validateString() {
    const inputString = document.getElementById('input-string').value.trim();
    const resultElement = document.getElementById('validation-result');

    if (!automaton.transitions) {
        resultElement.innerText = 'Primero debe generar un autómata ❌';
        resultElement.className = 'rejected show';
        return;
    }

    let currentState = automaton.initialState;
    let path = [currentState];

    for (const symbol of inputString) {
        if (automaton.transitions[currentState] && automaton.transitions[currentState][symbol]) {
            currentState = automaton.transitions[currentState][symbol];
            path.push(currentState);
        } else {
            resultElement.innerText = `Cadena rechazada ❌\nSin transición desde ${currentState} con símbolo ${symbol}`;
            resultElement.className = 'rejected show';
            return;
        }
    }

    if (automaton.finalStates.includes(currentState)) {
        resultElement.innerText = `Cadena aceptada ✔️\nCamino: ${path.join(' → ')}`;
        resultElement.className = 'accepted show';
    } else {
        resultElement.innerText = `Cadena rechazada ❌\nÚltimo estado ${currentState} no es final`;
        resultElement.className = 'rejected show';
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
