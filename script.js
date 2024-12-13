document.getElementById('generate-btn').addEventListener('click', drawAutomata);
document.getElementById('validate-btn').addEventListener('click', validateString);
document.getElementById('manual-mode-btn').addEventListener('click', enableManualMode);

let automaton = {};
let isManualMode = false;
let manualStates = [];
let manualTransitions = [];
let selectedState = null;
let draggedState = null;
let isTransitionMode = false;
let transitionStartState = null;

function enableManualMode() {
    isManualMode = !isManualMode;
    const container = document.getElementById('automata-container');
    const svg = container.querySelector('#automata-svg');
    
    if (isManualMode) {
        // Clear previous content
        svg.innerHTML = '';
        svg.style.cursor = 'crosshair';
        
        // Add events for manual mode
        svg.addEventListener('click', createStateOnSVG);
        svg.addEventListener('mousemove', dragState);
        svg.addEventListener('mouseup', dropState);
    } else {
        // Remove events for manual mode
        svg.removeEventListener('click', createStateOnSVG);
        svg.removeEventListener('mousemove', dragState);
        svg.removeEventListener('mouseup', dropState);
        svg.style.cursor = 'default';
    }

    // Show/hide manual controls
    const manualControls = document.getElementById('manual-transitions');
    const defaultControls = document.getElementById('form-container');
    
    manualControls.style.display = isManualMode ? 'block' : 'none';
    defaultControls.style.display = isManualMode ? 'none' : 'block';
}

function createStateOnSVG(event) {
    if (!isManualMode || isTransitionMode) return;

    const svg = event.target.closest('svg');
    const svgRect = svg.getBoundingClientRect();
    const x = event.clientX - svgRect.left;
    const y = event.clientY - svgRect.top;

    // Create state
    const stateGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    stateGroup.classList.add('state-group');
    stateGroup.dataset.id = `q${manualStates.length}`;

    const stateCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    stateCircle.setAttribute('cx', x);
    stateCircle.setAttribute('cy', y);
    stateCircle.setAttribute('r', 35);
    stateCircle.setAttribute('fill', 'url(#stateGradient)');
    stateCircle.setAttribute('stroke', 'white');
    stateCircle.setAttribute('stroke-width', '3');

    const stateText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    stateText.setAttribute('x', x);
    stateText.setAttribute('y', y);
    stateText.setAttribute('text-anchor', 'middle');
    stateText.setAttribute('dy', '5');
    stateText.setAttribute('fill', 'white');
    stateText.setAttribute('font-weight', 'bold');
    stateText.textContent = `q${manualStates.length}`;

    stateGroup.appendChild(stateCircle);
    stateGroup.appendChild(stateText);
    
    // Events for the state
    stateGroup.addEventListener('mousedown', startDragState);
    stateGroup.addEventListener('click', handleStateClick);

    svg.appendChild(stateGroup);

    // Save state information
    manualStates.push({
        id: `q${manualStates.length}`,
        x: x,
        y: y,
        element: stateGroup
    });

    updateGeneratedData();
}

function handleStateClick(event) {
    const stateGroup = event.currentTarget;
    const stateId = stateGroup.dataset.id;
    
    // Lógica de botón de estado inicial
    const isInitialStateBtn = document.getElementById('set-initial-btn').classList.contains('active');
    if (isInitialStateBtn) {
        const svg = stateGroup.closest('svg');
        // Quitar marca de estado inicial de todos los estados
        svg.querySelectorAll('.state-group').forEach(group => {
            group.querySelector('circle').setAttribute('stroke', 'white');
            group.classList.remove('initial-state');
        });
        
        // Marcar el estado actual como inicial
        stateGroup.querySelector('circle').setAttribute('stroke', 'green');
        stateGroup.classList.add('initial-state');
        
        // Deactivate initial state button after selection
        document.getElementById('set-initial-btn').classList.remove('active');
    }
    
    // Lógica de botón de estado final
    const isFinalStateBtn = document.getElementById('set-final-btn').classList.contains('active');
    if (isFinalStateBtn) {
        // Alternar estado final
        stateGroup.classList.toggle('final-state');
        const circle = stateGroup.querySelector('circle');
        
        if (stateGroup.classList.contains('final-state')) {
            // Agregar borde discontinuo para estados finales
            circle.setAttribute('stroke-dasharray', '5,5');
        } else {
            // Quitar borde discontinuo si se desmarca como final
            circle.removeAttribute('stroke-dasharray');
        }
        
        // Deactivate final state button after selection
        document.getElementById('set-final-btn').classList.remove('active');
    }

    updateGeneratedData();
}

function createTransition(fromState, toState, symbol) {
    const svg = fromState.closest('svg');
    const fromX = parseFloat(fromState.querySelector('circle').getAttribute('cx'));
    const fromY = parseFloat(fromState.querySelector('circle').getAttribute('cy'));
    const toX = parseFloat(toState.querySelector('circle').getAttribute('cx'));
    const toY = parseFloat(toState.querySelector('circle').getAttribute('cy'));

    // Verificar si es una transición al mismo estado
    const isSelfTransition = fromState === toState;

    if (isSelfTransition) {
        // Crear transición circular
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const radius = 35; // Radio del estado
        
        path.setAttribute('d', `
            M ${fromX-radius} ${fromY} 
            A ${radius*1.5} ${radius*1.5} 0 1 1 ${fromX+radius} ${fromY}
        `);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#ff4081');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('marker-end', 'url(#arrowhead)');
        path.dataset.from = fromState.dataset.id;
        path.dataset.to = toState.dataset.id;

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute('x', fromX + radius);
        text.setAttribute('y', fromY - radius/2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#ff4081');
        text.textContent = symbol;

        svg.appendChild(path);
        svg.appendChild(text);
    } else {
        // Transición entre estados diferentes
        // Calcular ángulo y distancia para ajustar la flecha
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);
        const length = Math.sqrt(dx*dx + dy*dy);

        // Ajustar puntos de inicio y fin para no tocar directamente los estados
        const stateRadius = 35;
        const startX = fromX + Math.cos(angle) * stateRadius;
        const startY = fromY + Math.sin(angle) * stateRadius;
        const endX = toX - Math.cos(angle) * stateRadius;
        const endY = toY - Math.sin(angle) * stateRadius;

        // Crear línea de transición
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute('x1', startX);
        line.setAttribute('y1', startY);
        line.setAttribute('x2', endX);
        line.setAttribute('y2', endY);
        line.setAttribute('stroke', '#ff4081');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('marker-end', 'url(#arrowhead)');
        line.dataset.from = fromState.dataset.id;
        line.dataset.to = toState.dataset.id;

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute('x', (startX + endX) / 2);
        text.setAttribute('y', (startY + endY) / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#ff4081');
        text.textContent = symbol;

        svg.appendChild(line);
        svg.appendChild(text);
    }

    // Guardar transición
    manualTransitions.push({
        from: fromState.dataset.id,
        to: toState.dataset.id,
        symbol: symbol
    });

    updateGeneratedData();
}

function startDragState(event) {
    if (!isManualMode) return;
    
    draggedState = event.currentTarget;
    draggedState.classList.add('dragging');
    
    // Guardar offset del ratón respecto al estado
    const svgRect = draggedState.closest('svg').getBoundingClientRect();
    const stateRect = draggedState.getBoundingClientRect();
    
    draggedState.dataset.offsetX = event.clientX - stateRect.left + svgRect.left;
    draggedState.dataset.offsetY = event.clientY - stateRect.top + svgRect.top;
}

function dragState(event) {
    if (!draggedState || !isManualMode) return;
    
    const svg = event.target.closest('svg');
    const svgRect = svg.getBoundingClientRect();
    
    const offsetX = parseFloat(draggedState.dataset.offsetX);
    const offsetY = parseFloat(draggedState.dataset.offsetY);
    
    const newX = event.clientX - svgRect.left;
    const newY = event.clientY - svgRect.top;
    
    const circle = draggedState.querySelector('circle');
    const text = draggedState.querySelector('text');
    
    circle.setAttribute('cx', newX);
    circle.setAttribute('cy', newY);
    text.setAttribute('x', newX);
    text.setAttribute('y', newY);
    
    // Actualizar datos de estado manual
    const stateIndex = manualStates.findIndex(state => state.id === draggedState.dataset.id);
    if (stateIndex !== -1) {
        manualStates[stateIndex].x = newX;
        manualStates[stateIndex].y = newY;
    }
    
    // Actualizar transiciones conectadas
    updateConnectedTransitions();
}

function dropState(event) {
    if (!draggedState || !isManualMode) return;
    
    draggedState.classList.remove('dragging');
    draggedState = null;
    
    updateGeneratedData();
}

function selectState(event) {
    if (!isManualMode) return;
    
    const stateGroup = event.currentTarget;
    const isInitialStateBtn = document.getElementById('set-initial-btn').classList.contains('active');
    const isFinalStateBtn = document.getElementById('set-final-btn').classList.contains('active');
    
    if (isInitialStateBtn) {
        // Remover estado inicial previo
        const svg = stateGroup.closest('svg');
        svg.querySelectorAll('.state-group').forEach(group => {
            group.querySelector('circle').setAttribute('stroke', 'white');
        });
        
        stateGroup.querySelector('circle').setAttribute('stroke', 'green');
        stateGroup.classList.add('initial-state');
    }
    
    if (isFinalStateBtn) {
        stateGroup.classList.toggle('final-state');
        const circle = stateGroup.querySelector('circle');
        
        if (stateGroup.classList.contains('final-state')) {
            circle.setAttribute('stroke-dasharray', '5,5');
        } else {
            circle.removeAttribute('stroke-dasharray');
        }
    }
    
    updateGeneratedData();
}

function addTransition() {
    const fromState = document.getElementById('from-state').value;
    const toState = document.getElementById('to-state').value;
    const symbol = document.getElementById('symbol').value;

    if (!fromState || !toState || !symbol) {
        alert('Por favor, complete todos los campos');
        return;
    }

    const fromStateEl = document.querySelector(`[data-id="${fromState}"]`);
    const toStateEl = document.querySelector(`[data-id="${toState}"]`);

    if (!fromStateEl || !toStateEl) {
        alert('Los estados seleccionados no existen');
        return;
    }

    const svg = fromStateEl.closest('svg');
    
    const fromX = parseFloat(fromStateEl.querySelector('circle').getAttribute('cx'));
    const fromY = parseFloat(fromStateEl.querySelector('circle').getAttribute('cy'));
    const toX = parseFloat(toStateEl.querySelector('circle').getAttribute('cx'));
    const toY = parseFloat(toStateEl.querySelector('circle').getAttribute('cy'));

    // Crear flecha de transición
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute('x1', fromX);
    line.setAttribute('y1', fromY);
    line.setAttribute('x2', toX);
    line.setAttribute('y2', toY);
    line.setAttribute('stroke', '#ff4081');
    line.setAttribute('marker-end', 'url(#arrowhead)');

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute('x', (fromX + toX) / 2);
    text.setAttribute('y', (fromY + toY) / 2);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#ff4081');
    text.textContent = symbol;

    svg.appendChild(line);
    svg.appendChild(text);

    // Guardar transición
    manualTransitions.push({
        from: fromState,
        to: toState,
        symbol: symbol
    });

    updateGeneratedData();
}

function updateConnectedTransitions() {
    const svg = document.getElementById('automata-svg');
    const lines = svg.querySelectorAll('line');
    const texts = svg.querySelectorAll('text[fill="#ff4081"]');

    lines.forEach((line, index) => {
        const fromStateId = line.getAttribute('data-from');
        const toStateId = line.getAttribute('data-to');
        
        const fromStateEl = document.querySelector(`[data-id="${fromStateId}"]`);
        const toStateEl = document.querySelector(`[data-id="${toStateId}"]`);
        
        if (fromStateEl && toStateEl) {
            const fromX = parseFloat(fromStateEl.querySelector('circle').getAttribute('cx'));
            const fromY = parseFloat(fromStateEl.querySelector('circle').getAttribute('cy'));
            const toX = parseFloat(toStateEl.querySelector('circle').getAttribute('cx'));
            const toY = parseFloat(toStateEl.querySelector('circle').getAttribute('cy'));

            line.setAttribute('x1', fromX);
            line.setAttribute('y1', fromY);
            line.setAttribute('x2', toX);
            line.setAttribute('y2', toY);

            texts[index].setAttribute('x', (fromX + toX) / 2);
            texts[index].setAttribute('y', (fromY + toY) / 2);
        }
    });
}

function updateGeneratedData() {
    const statesDisplay = document.getElementById('generated-states');
    const initialStateDisplay = document.getElementById('generated-initial-state');
    const finalStatesDisplay = document.getElementById('generated-final-states');
    const transitionsDisplay = document.getElementById('generated-transitions');

    const states = manualStates.map(state => state.id);
    const initialState = document.querySelector('.initial-state')?.dataset.id;
    const finalStates = Array.from(document.querySelectorAll('.final-state')).map(state => state.dataset.id);
    const transitions = manualTransitions;

    statesDisplay.innerText = `Estados: ${states.join(', ')}`;
    initialStateDisplay.innerText = `Estado inicial: ${initialState || 'No definido'}`;
    finalStatesDisplay.innerText = `Estados finales: ${finalStates.join(', ')}`;
    transitionsDisplay.innerText = `Transiciones: ${transitions.map(t => `${t.from},${t.symbol},${t.to}`).join('; ')}`;
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

// Add event listeners for transition mode button
document.getElementById('add-transition-mode-btn').addEventListener('click', toggleTransitionMode);

function toggleTransitionMode() {
    isTransitionMode = !isTransitionMode;
    const btn = document.getElementById('add-transition-mode-btn');
    btn.classList.toggle('active');

    // Reset any previous transition start state
    if (transitionStartState) {
        transitionStartState.querySelector('circle').setAttribute('stroke', 'white');
        transitionStartState = null;
    }
}
// Add event listeners for initial and final state buttons
document.getElementById('set-initial-btn').addEventListener('click', function() {
    const btn = document.getElementById('set-initial-btn');
    btn.classList.toggle('active');
    
    // Deactivate other mode buttons
    document.getElementById('set-final-btn').classList.remove('active');
    document.getElementById('add-transition-mode-btn').classList.remove('active');
    
    // Reset transition mode
    isTransitionMode = false;
    transitionStartState = null;
});

document.getElementById('set-final-btn').addEventListener('click', function() {
    const btn = document.getElementById('set-final-btn');
    btn.classList.toggle('active');
    
    // Deactivate other mode buttons
    document.getElementById('set-initial-btn').classList.remove('active');
    document.getElementById('add-transition-mode-btn').classList.remove('active');
    
    // Reset transition mode
    isTransitionMode = false;
    transitionStartState = null;
});