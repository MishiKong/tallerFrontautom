document.getElementById('generate-btn').addEventListener('click', drawAutomata);
document.getElementById('validate-btn').addEventListener('click', validateString);
document.getElementById('manual-mode-btn').addEventListener('click', enableManualMode);

let isManualMode = false;
let selectedStates = [];
let isInitialStateMode = false;
let isFinalStateMode = false;
let isTransitionMode = false;
let transitionStartState = null;

// Objeto para almacenar el autómata
let automaton = {
    states: [],
    initialState: null,
    finalStates: [],
    transitions: {}
};

function enableManualMode() {
    isManualMode = !isManualMode;
    const manualModeBtn = document.getElementById('manual-mode-btn');
    const manualControls = document.getElementById('manual-transitions');
    const automataContainer = document.getElementById('automata-container');
    const svg = document.getElementById('automata-svg');

    if (isManualMode) {
        // Activar modo manual
        manualModeBtn.textContent = 'Salir del Modo Manual';
        manualControls.style.display = 'block';
        svg.innerHTML = ''; // Limpiar el SVG
        
        // Reiniciar el autómata
        automaton = {
            states: [],
            initialState: null,
            finalStates: [],
            transitions: {}
        };
        selectedStates = [];
        
        // Agregar eventos de clic al SVG para crear estados
        svg.addEventListener('click', createState);
        
    } else {
        // Desactivar modo manual
        manualModeBtn.textContent = 'Modo Manual: Dibujar Autómata';
        manualControls.style.display = 'none';
        resetAllModes();
    }
}

function createState(event) {
    if (!isManualMode || isTransitionMode || event.target !== event.currentTarget) return;

    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Crear estado
    const stateName = `q${automaton.states.length}`;
    
    // Crear grupo para el estado
    const stateGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    stateGroup.classList.add('state-group');
    stateGroup.dataset.state = stateName;

    // Crear círculo
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', '35');
    circle.setAttribute('fill', 'url(#stateGradient)');
    circle.setAttribute('stroke', 'white');
    circle.setAttribute('stroke-width', '3');

    // Crear texto
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dy', '5');
    text.setAttribute('fill', 'white');
    text.textContent = stateName;

    // Agregar elementos al grupo
    stateGroup.appendChild(circle);
    stateGroup.appendChild(text);

    // Agregar evento de clic al estado
    stateGroup.addEventListener('click', handleStateClick);

    // Agregar al SVG
    svg.appendChild(stateGroup);

    // Actualizar el autómata
    automaton.states.push(stateName);
    updateGeneratedData();
}

function handleStateClick(event) {
    if (!isManualMode) return;
    event.stopPropagation();

    const stateGroup = event.currentTarget;
    const stateName = stateGroup.dataset.state;

    if (isInitialStateMode) {
        // Establecer estado inicial
        setInitialState(stateGroup);
    } else if (isFinalStateMode) {
        // Alternar estado final
        toggleFinalState(stateGroup);
    } else if (isTransitionMode) {
        // Manejar transiciones
        handleTransitionState(stateGroup);
    }

    updateGeneratedData();
}

function setInitialState(stateGroup) {
    const svg = stateGroup.closest('svg');
    const stateName = stateGroup.dataset.state;

    // Remover marca de estado inicial anterior
    svg.querySelectorAll('.state-group').forEach(group => {
        group.querySelector('circle').setAttribute('stroke', 'white');
    });

    // Marcar nuevo estado inicial
    stateGroup.querySelector('circle').setAttribute('stroke', 'green');
    automaton.initialState = stateName;
    resetAllModes();
}

function toggleFinalState(stateGroup) {
    const circle = stateGroup.querySelector('circle');
    const stateName = stateGroup.dataset.state;

    if (automaton.finalStates.includes(stateName)) {
        // Remover estado final
        circle.removeAttribute('stroke-dasharray');
        automaton.finalStates = automaton.finalStates.filter(state => state !== stateName);
    } else {
        // Agregar estado final
        circle.setAttribute('stroke-dasharray', '5,5');
        automaton.finalStates.push(stateName);
    }
}

function handleTransitionState(stateGroup) {
    if (!transitionStartState) {
        // Seleccionar estado inicial de la transición
        transitionStartState = stateGroup;
        stateGroup.querySelector('circle').setAttribute('stroke', 'yellow');
    } else {
        // Crear transición
        const symbol = prompt('Ingrese el símbolo para la transición:');
        if (symbol) {
            const fromState = transitionStartState.dataset.state;
            const toState = stateGroup.dataset.state;

            // Agregar transición al autómata
            if (!automaton.transitions[fromState]) {
                automaton.transitions[fromState] = {};
            }
            automaton.transitions[fromState][symbol] = toState;

            // Dibujar la transición
            createTransitionArrow(transitionStartState, stateGroup, symbol);
        }

        // Resetear estado inicial de transición
        transitionStartState.querySelector('circle').setAttribute('stroke', 'white');
        transitionStartState = null;
    }
}

function createTransitionArrow(fromState, toState, symbol) {
    const svg = fromState.closest('svg');
    const fromCircle = fromState.querySelector('circle');
    const toCircle = toState.querySelector('circle');

    const x1 = parseFloat(fromCircle.getAttribute('cx'));
    const y1 = parseFloat(fromCircle.getAttribute('cy'));
    const x2 = parseFloat(toCircle.getAttribute('cx'));
    const y2 = parseFloat(toCircle.getAttribute('cy'));

    // Crear línea de transición
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', '#ff4081');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('marker-end', 'url(#arrowhead)');

    // Crear texto de la transición
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute('x', (x1 + x2) / 2);
    text.setAttribute('y', (y1 + y2) / 2 - 10);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#ff4081');
    text.textContent = symbol;

    svg.appendChild(line);
    svg.appendChild(text);
}

function resetAllModes() {
    isInitialStateMode = false;
    isFinalStateMode = false;
    isTransitionMode = false;
    transitionStartState = null;

    // Resetear botones
    document.getElementById('set-initial-btn').classList.remove('active');
    document.getElementById('set-final-btn').classList.remove('active');
    document.getElementById('add-transition-mode-btn').classList.remove('active');
}

// Eventos para los botones de modo
document.getElementById('set-initial-btn').addEventListener('click', function() {
    resetAllModes();
    isInitialStateMode = true;
    this.classList.add('active');
});

document.getElementById('set-final-btn').addEventListener('click', function() {
    resetAllModes();
    isFinalStateMode = true;
    this.classList.add('active');
});

document.getElementById('add-transition-mode-btn').addEventListener('click', function() {
    resetAllModes();
    isTransitionMode = true;
    this.classList.add('active');
});

function updateGeneratedData() {
    const generatedStates = document.getElementById('generated-states');
    const generatedInitialState = document.getElementById('generated-initial-state');
    const generatedFinalStates = document.getElementById('generated-final-states');
    const generatedTransitions = document.getElementById('generated-transitions');

    generatedStates.textContent = `Estados: ${automaton.states.join(', ')}`;
    generatedInitialState.textContent = `Estado inicial: ${automaton.initialState || 'No establecido'}`;
    generatedFinalStates.textContent = `Estados finales: ${automaton.finalStates.join(', ') || 'Ninguno'}`;
    
    // Formatear transiciones para mostrar
    const transitionStrings = [];
    Object.entries(automaton.transitions).forEach(([fromState, transitions]) => {
        Object.entries(transitions).forEach(([symbol, toState]) => {
            transitionStrings.push(`${fromState},${symbol},${toState}`);
        });
    });
    generatedTransitions.textContent = `Transiciones: ${transitionStrings.join('; ') || 'Ninguna'}`;
}

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

    const svgWidth = svg.clientWidth || 600;
    const svgHeight = svg.clientHeight || 400;
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;
    
    // Ajustar radio basado en el número de estados
    const radius = Math.min(svgWidth, svgHeight) / 2 - 100;
    const stateRadius = 35; // Radio del estado
    const stateDiameter = stateRadius * 2;

    const positions = {};

    // Distribuir los estados en una cuadrícula en lugar de un círculo
    const statesPerRow = Math.ceil(Math.sqrt(states.length));
    const offsetX = 100; // Espacio entre los estados en X
    const offsetY = 100; // Espacio entre los estados en Y

    states.forEach((state, index) => {
        let x, y;

        // Si es el estado inicial, lo ubicamos manualmente a la izquierda
        if (state === initialState) {
            x = centerX - 2 * offsetX; // A la izquierda
            y = centerY; // Centrado verticalmente
        } else {
            // Distribuir en una cuadrícula
            const row = Math.floor(index / statesPerRow);
            const col = index % statesPerRow;

            x = centerX - (statesPerRow / 2) * offsetX + col * offsetX;
            y = centerY - (states.length / statesPerRow / 2) * offsetY + row * offsetY;
        }

        // Crear círculo de estado
        const stateCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        stateCircle.setAttribute('cx', x);
        stateCircle.setAttribute('cy', y);
        stateCircle.setAttribute('r', stateRadius);
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
            const startX = x - 50;
            const startY = y;
            const endX = x - 35;
            const endY = y;

            const arrow = document.createElementNS("http://www.w3.org/2000/svg", "line");
            arrow.setAttribute('x1', startX);
            arrow.setAttribute('y1', startY);
            arrow.setAttribute('x2', endX);
            arrow.setAttribute('y2', endY);
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
    
    // Si el estado origen y destino son el mismo (transición reflexiva)
    if (fromPos.x === toPos.x && fromPos.y === toPos.y) {
        // Dibujar una curva que representa una transición al mismo estado
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        
        // Calcular puntos para la curva
        const x = fromPos.x;
        const y = fromPos.y;
        const curveOffset = 50; // Tamaño de la curva
        
        path.setAttribute('d', `
            M ${x-10} ${y - 35} 
            Q ${x} ${y-100} ${x+15} ${y-40}
        `);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#ff4081');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('marker-end', 'url(#arrowhead)');
        
        // Texto de la transición
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute('x', x);
        text.setAttribute('y', y - 75);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#ff4081');
        text.setAttribute('font-size', '12');
        text.textContent = label;
        
        svg.appendChild(path);
        svg.appendChild(text);
        return;
    }

    // Calcular la dirección de la flecha para estados diferentes
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
    line.setAttribute('y1', startY+20);
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