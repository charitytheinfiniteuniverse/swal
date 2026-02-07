/* DATABASE INITIALIZATION အစ */
const db = new Dexie("VectorProDB");
db.version(1).stores({ projects: "++id, name, data, date" });
/* DATABASE INITIALIZATION အဆုံး */

/* GLOBAL STATE အစ */
const svg = document.getElementById('canvas');
const mainGroup = document.getElementById('main-group');
const layerList = document.getElementById('layer-list');
let tool = 'select';
let isDrawing = false;
let currentPath = null;
let selectedElement = null;
let offset = { x: 0, y: 0 };
/* GLOBAL STATE အဆုံး */

/* TOOL MANAGEMENT အစ */
function setTool(t) {
    tool = t;
    document.querySelectorAll('.tool-group button').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + t).classList.add('active');
    if(t !== 'select') deselectAll();
}
/* TOOL MANAGEMENT အဆုံး */

/* SVG COORDINATES CALCULATOR အစ */
function getCoords(e) {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
}
/* SVG COORDINATES CALCULATOR အဆုံး */

/* DRAWING ENGINE အစ */
svg.addEventListener('mousedown', e => {
    const pt = getCoords(e);
    
    if (tool === 'select') {
        if (e.target !== svg && e.target.parentNode === mainGroup) {
            selectElement(e.target);
            const bbox = selectedElement.getBBox();
            offset.x = pt.x - (selectedElement.getAttribute('x') || bbox.x);
            offset.y = pt.y - (selectedElement.getAttribute('y') || bbox.y);
            isDrawing = true;
        } else {
            deselectAll();
        }
        return;
    }

    isDrawing = true;
    const fill = document.getElementById('fillColor').value;
    const stroke = document.getElementById('strokeColor').value;
    const sw = document.getElementById('strokeWidth').value;

    if (tool === 'pen') {
        currentPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        currentPath.setAttribute("d", `M ${pt.x} ${pt.y}`);
        currentPath.setAttribute("fill", "none");
        currentPath.setAttribute("stroke", stroke);
        currentPath.setAttribute("stroke-width", sw);
        mainGroup.appendChild(currentPath);
    } else if (tool === 'rect') {
        currentPath = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        currentPath.setAttribute("x", pt.x); currentPath.setAttribute("y", pt.y);
        currentPath.setAttribute("fill", fill);
        currentPath.setAttribute("stroke", stroke);
        currentPath.setAttribute("stroke-width", sw);
        mainGroup.appendChild(currentPath);
        currentPath.startX = pt.x; currentPath.startY = pt.y;
    }
    // Circle & Text Logic can be added similarly
});

svg.addEventListener('mousemove', e => {
    if (!isDrawing) return;
    const pt = getCoords(e);

    if (tool === 'select' && selectedElement) {
        if(selectedElement.tagName === 'rect') {
            selectedElement.setAttribute('x', pt.x - offset.x);
            selectedElement.setAttribute('y', pt.y - offset.y);
        } else {
            selectedElement.setAttribute('transform', `translate(${pt.x - offset.x}, ${pt.y - offset.y})`);
        }
    } else if (tool === 'pen') {
        const d = currentPath.getAttribute("d");
        currentPath.setAttribute("d", `${d} L ${pt.x} ${pt.y}`);
    } else if (tool === 'rect') {
        const x = Math.min(pt.x, currentPath.startX);
        const y = Math.min(pt.y, currentPath.startY);
        currentPath.setAttribute("x", x);
        currentPath.setAttribute("y", y);
        currentPath.setAttribute("width", Math.abs(pt.x - currentPath.startX));
        currentPath.setAttribute("height", Math.abs(pt.y - currentPath.startY));
    }
});

svg.addEventListener('mouseup', () => {
    isDrawing = false;
    currentPath = null;
    updateLayers();
});
/* DRAWING ENGINE အဆုံး */

/* LAYER MANAGEMENT အစ */
function updateLayers() {
    layerList.innerHTML = "";
    const nodes = Array.from(mainGroup.children).reverse();
    nodes.forEach((node, index) => {
        const div = document.createElement('div');
        div.className = 'layer-item';
        div.innerHTML = `
            <span>${node.tagName} ${nodes.length - index}</span>
            <div class="layer-btns">
                <button onclick="moveLayer(${nodes.length - 1 - index}, 1)"><i class="fas fa-arrow-up"></i></button>
                <button onclick="moveLayer(${nodes.length - 1 - index}, -1)"><i class="fas fa-arrow-down"></i></button>
                <button onclick="deleteLayer(${nodes.length - 1 - index})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        layerList.appendChild(div);
    });
}

function moveLayer(idx, dir) {
    const children = mainGroup.children;
    if (dir === 1 && idx < children.length - 1) {
        mainGroup.insertBefore(children[idx + 1], children[idx]);
    } else if (dir === -1 && idx > 0) {
        mainGroup.insertBefore(children[idx], children[idx - 1]);
    }
    updateLayers();
}

function deleteLayer(idx) {
    mainGroup.children[idx].remove();
    updateLayers();
}
/* LAYER MANAGEMENT အဆုံး */

/* SELECTION LOGIC အစ */
function selectElement(el) {
    deselectAll();
    selectedElement = el;
    selectedElement.style.outline = "2px solid #007acc";
}

function deselectAll() {
    if (selectedElement) selectedElement.style.outline = "none";
    selectedElement = null;
}
/* SELECTION LOGIC အဆုံး */

/* PROJECT SAVE/EXPORT အစ */
async function saveProject() {
    const name = prompt("Project Name:", "New Logo");
    if(!name) return;
    await db.projects.add({ name, data: mainGroup.innerHTML, date: new Date() });
    alert("Saved to IndexedDB!");
}

function exportSVG() {
    const blob = new Blob([svg.outerHTML], {type: "image/svg+xml"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = "design.svg"; a.click();
}

function toggleSidebar(id) {
    document.getElementById(id).classList.toggle('active');
}
/* PROJECT SAVE/EXPORT အဆုံး */
