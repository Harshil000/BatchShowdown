const createButtons = document.querySelectorAll('.createButton');
const canvas = document.querySelector('.canvas');
const verticalPanel = document.querySelector('.vertical-panel');
const horizontalPanel = document.querySelector('.horizontal-panel');
const colorSelector = document.querySelector('.color-selector');
const layersContainer = document.querySelector('.layers');
const editButtons = document.querySelectorAll('.editButtons');
// Make canvas focusable for keyboard events
canvas.setAttribute('tabindex', '0');

let selectedButton = null;
let color = colorSelector.value;
let Zindex = null;
let elementsMetaData = null;
let uniqueIdCounter = null;
let selectedElement = null;
let layersMetaData = [];
let boxNumber = null;
let textBoxNumber = null;

if (localStorage.getItem('Zindex')) {
    Zindex = parseInt(localStorage.getItem('Zindex'));
} else {
    Zindex = 1;
}

if (localStorage.getItem('uniqueIdCounter')) {
    uniqueIdCounter = parseInt(localStorage.getItem('uniqueIdCounter'));
} else {
    uniqueIdCounter = 1;
}

if (localStorage.getItem('elementsMetaData')) {
    elementsMetaData = JSON.parse(localStorage.getItem('elementsMetaData'));
} else {
    elementsMetaData = [];
}

if (localStorage.getItem('boxNumber')) {
    boxNumber = parseInt(localStorage.getItem('boxNumber'));
} else {
    boxNumber = 1;
}

if (localStorage.getItem('textBoxNumber')) {
    textBoxNumber = parseInt(localStorage.getItem('textBoxNumber'));
} else {
    textBoxNumber = 1;
}

function syncLocalStorage() {
    localStorage.setItem('elementsMetaData', JSON.stringify(elementsMetaData));
    localStorage.setItem('Zindex', Zindex);
    localStorage.setItem('uniqueIdCounter', uniqueIdCounter);
    localStorage.setItem('boxNumber', boxNumber);
    localStorage.setItem('textBoxNumber', textBoxNumber);
}

function syncLayers() {
    layersMetaData = elementsMetaData.sort((a, b) => b.zIndex - a.zIndex);
    layersContainer.innerHTML = '';
    layersMetaData.forEach((data) => {
        const layer = document.createElement('span');
        layer.classList.add('layer-item');
        layer.innerHTML = `${data.type === 'text' ? 'Text ' : 'Box '} ${data.type === 'text' ? data.textBoxNumber : data.boxNumber}`;;
        layer.setAttribute('data-idLayer', data.id);
        layersContainer.appendChild(layer);
    });
}

syncLayers();

elementsMetaData.forEach(data => {
    const newElement = document.createElement('div');
    newElement.style.top = data.top;
    newElement.style.left = data.left;
    newElement.style.height = data.height;
    newElement.style.width = data.width;
    newElement.style.backgroundColor = data.backgroundColor;
    newElement.style.zIndex = data.zIndex;
    newElement.style.padding = '0.5rem';
    newElement.style.position = 'absolute';
    newElement.style.borderRadius = '1rem';
    newElement.style.transform = data.transform;
    newElement.style.transition = 'all 0.3s ease';
    newElement.style.cursor = 'pointer';
    newElement.setAttribute('data-id', data.id);
    if (data.type === 'text') {
        newElement.innerText = data.content;
    }
    canvas.appendChild(newElement);
});

colorSelector.addEventListener('input', (e) => {
    color = e.target.value;
});


function makeElementSelected() {
    selectedElement.classList.add('selected-element');
}

function removeElementSelected() {
    document.querySelectorAll('.selected-element').forEach(el => el.classList.remove('selected-element'));
    selectedElement = null;
}

layersContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('layer-item')) {
        // const id = e.target.getAttribute('data-idLayer');
        if (selectedElement === canvas.querySelector(`[data-id="${e.target.getAttribute('data-idLayer')}"]`)) {
            selectedElement = null;
            e.target.classList.remove('selected-layer');
            removeElementSelected();
            return;
        }
        removeElementSelected();
        selectedElement = canvas.querySelector(`[data-id="${e.target.getAttribute('data-idLayer')}"]`);
        document.querySelectorAll('.layer-item').forEach(layer => layer.classList.remove('selected-layer'));
        e.target.classList.add('selected-layer');
        makeElementSelected();

        canvas.focus();
    }
});

createButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (button === selectedButton) {
            button.classList.remove('selectedButton');
            document.body.style.cursor = 'default';
            selectedButton = null;
            return;
        }
        createButtons.forEach(btn => btn.classList.remove('selectedButton'));

        document.body.style.cursor = 'crosshair';
        button.classList.add('selectedButton');
        selectedButton = button;
    });
});

verticalPanel.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
});

horizontalPanel.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
});

canvas.addEventListener('pointerdown', (e) => {
    if (!selectedButton) {
        return;
    }

    const previewElement = document.createElement('div');
    previewElement.style.position = 'absolute';
    previewElement.style.top = `${e.y}px`;
    previewElement.style.left = `${e.x}px`;
    previewElement.style.border = `2px dashed ${color}`;
    previewElement.style.zIndex = Zindex;
    previewElement.style.borderRadius = '1rem';
    previewElement.style.willChange = 'width, height';
    previewElement.style.pointerEvents = 'none';
    canvas.appendChild(previewElement);

    let rafId = null;
    let currentMouseX = e.x;
    let currentMouseY = e.y;

    const updatePreview = () => {
        if (!selectedButton) {
            return;
        }
        let height = Math.abs(currentMouseY - e.y);
        let width = Math.abs(currentMouseX - e.x);
        if (currentMouseY < e.y) {
            previewElement.style.transform = 'translateY(-100%)';
        } else {
            previewElement.style.transform = 'translateY(0)';
        }
        if (currentMouseX < e.x) {
            previewElement.style.transform += 'translateX(-100%)';
        } else {
            previewElement.style.transform += 'translateX(0)';
        }
        previewElement.style.height = `${height}px`;
        previewElement.style.width = `${width}px`;
    };

    const handleMouseMove = (ev) => {
        currentMouseX = ev.x;
        currentMouseY = ev.y;

        if (rafId) {
            return;
        }

        rafId = requestAnimationFrame(() => {
            updatePreview();
            rafId = null;
        });
    };

    canvas.addEventListener('pointermove', handleMouseMove);

    const handlePointerUp = (ev) => {
        let height = Math.abs(ev.y - e.y);
        let width = Math.abs(ev.x - e.x);
        const newElement = document.createElement('div');
        newElement.style.top = `${e.y}px`;
        newElement.style.left = `${e.x}px`;
        newElement.style.height = `${height}px`;
        newElement.style.width = `${width}px`;
        newElement.style.backgroundColor = color;
        newElement.style.zIndex = Zindex++;
        newElement.style.padding = '0.5rem';
        newElement.style.position = 'absolute';
        newElement.style.borderRadius = '1rem';
        newElement.style.transition = 'all 0.3s ease';
        newElement.style.cursor = 'pointer';
        if (currentMouseY < e.y) {
            newElement.style.transform = 'translateY(-100%)';
        } else {
            newElement.style.transform = 'translateY(0)';
        }
        if (currentMouseX < e.x) {
            newElement.style.transform += 'translateX(-100%)';
        } else {
            newElement.style.transform += 'translateX(0)';
        }

        const uniqueId = uniqueIdCounter++;
        newElement.setAttribute('data-id', uniqueId);

        if (selectedButton.id == 'createText') {
            newElement.innerText = `Text Box ${textBoxNumber}`;
            elementsMetaData.push({
                id: uniqueId,
                top: `${e.y}px`,
                left: `${e.x}px`,
                height: `${height}px`,
                width: `${width}px`,
                backgroundColor: color,
                zIndex: Zindex - 1,
                type: 'text',
                transform: newElement.style.transform,
                textBoxNumber: textBoxNumber,
                content: `Text Box ${textBoxNumber}`,
            });
            textBoxNumber++;
            syncLayers();
            syncLocalStorage();
        } else {
            elementsMetaData.push({
                id: uniqueId,
                top: `${e.y}px`,
                left: `${e.x}px`,
                height: `${height}px`,
                width: `${width}px`,
                backgroundColor: color,
                zIndex: Zindex - 1,
                type: 'solid',
                transform: newElement.style.transform,
                boxNumber: boxNumber,
            });
            boxNumber++;
            syncLayers();
            syncLocalStorage();
        }
        canvas.appendChild(newElement);
        document.body.style.cursor = 'default';
        selectedButton.classList.remove('selectedButton');
        selectedButton = null;

        if (rafId) {
            cancelAnimationFrame(rafId);
        }
        canvas.removeEventListener('pointermove', handleMouseMove);
        canvas.removeEventListener('pointerup', handlePointerUp);
        previewElement.remove();
    };

    canvas.addEventListener('pointerup', handlePointerUp);
})

canvas.addEventListener('click', (e) => {
    if (selectedButton) {
        return;
    }

    if (verticalPanel.contains(e.target) || horizontalPanel.contains(e.target)) {
        return;
    }

    const clickedElement = e.target.closest('[data-id]');

    if (clickedElement && clickedElement !== canvas) {
        const id = clickedElement.getAttribute('data-id');

        if (selectedElement === clickedElement) {
            selectedElement = null;
            removeElementSelected();
            document.querySelectorAll('.layer-item').forEach(layer => layer.classList.remove('selected-layer'));
        } else {
            removeElementSelected();
            selectedElement = clickedElement;
            makeElementSelected();

            canvas.focus();

            document.querySelectorAll('.layer-item').forEach(layer => {
                if (layer.getAttribute('data-idLayer') === id) {
                    layer.classList.add('selected-layer');
                } else {
                    layer.classList.remove('selected-layer');
                }
            });
        }
    } else {
        removeElementSelected();
        document.querySelectorAll('.layer-item').forEach(layer => layer.classList.remove('selected-layer'));
    }
})

canvas.addEventListener('keydown', (e) => {
    if (!selectedElement) {
        return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
        selectedElement.remove();
        elementsMetaData = elementsMetaData.filter(data => data.id !== parseInt(selectedElement.getAttribute('data-id')));
        syncLayers();
        syncLocalStorage();
        selectedElement = null;
        removeElementSelected();
    }
});

editButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (!selectedElement) {
            return;
        }
        // const layerFunction = button.getAttribute('data-layerFunction');
        // if (layerFunction === 'up') {
        //     if (selectedElement == layersMetaData[layersMetaData.length - 1].id) {
        //         return;
        //     }
        //     for (let i = 0; i < layersMetaData.length; i++) {
        //         if (layersMetaData[i].id === parseInt(selectedElement)) {
        //             layersMetaData[i].zIndex = layersMetaData[i].zIndex + 1;
        //             layersMetaData[i + 1].zIndex = layersMetaData[i + 1].zIndex - 1;
        //             break;
        //         }
        //     }
        //     syncLayers();
        //     syncLocalStorage();
        // } else if (layerFunction === 'down') {
        //     if (selectedElement == layersMetaData[0].id) {
        //         return;
        //     }
        //     for (let i = 0; i < layersMetaData.length; i++) {
        //         if (layersMetaData[i].id === parseInt(selectedElement)) {
        //             layersMetaData[i].zIndex = layersMetaData[i].zIndex - 1;
        //             layersMetaData[i - 1].zIndex = layersMetaData[i - 1].zIndex + 1;
        //             break;
        //         }
        //     }
        // }
        // syncLayers();
        // syncLocalStorage();
    })
}) 