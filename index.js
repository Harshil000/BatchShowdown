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
let selectedLayer = null;
let layersMetaData = [];
let boxNumber = null;
let textBoxNumber = null;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

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
    layersMetaData = [...elementsMetaData].sort((a, b) => b.zIndex - a.zIndex);
    layersContainer.innerHTML = '';
    layersMetaData.forEach((data) => {
        const layer = document.createElement('span');
        layer.classList.add('layer-item');
        layer.innerHTML = `${data.type === 'text' ? 'Text ' : 'Box '} ${data.type === 'text' ? data.textBoxNumber : data.boxNumber}`;
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
    newElement.style.cursor = 'pointer';
    newElement.classList.add('card');
    newElement.setAttribute('data-id', data.id);
    if (data.type === 'text') {
        newElement.innerText = data.content;
    }
    canvas.appendChild(newElement);
});

colorSelector.addEventListener('input', (e) => {
    color = e.target.value;
});

function rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb;
    const nums = rgb.match(/\d+/g);
    if (!nums) return '#000000';
    return '#' + nums.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
}

function createHandles(element) {
    removeHandles();

    const corners = ['nw', 'ne', 'se', 'sw'];
    corners.forEach(corner => {
        const handle = document.createElement('div');
        handle.classList.add('resize-handle', `resize-${corner}`);
        handle.setAttribute('data-corner', corner);
        element.appendChild(handle);
    });

    const rotateHandle = document.createElement('div');
    rotateHandle.classList.add('rotate-handle');
    element.appendChild(rotateHandle);

    attachResizeListeners(element);
    attachRotateListener(element);
}

function removeHandles() {
    document.querySelectorAll('.resize-handle').forEach(h => h.remove());
    document.querySelectorAll('.rotate-handle').forEach(h => h.remove());
}

function attachResizeListeners(element) {
    const handles = element.querySelectorAll('.resize-handle');
    handles.forEach(handle => {
        handle.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            const corner = handle.getAttribute('data-corner');
            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = element.offsetWidth;
            const startHeight = element.offsetHeight;
            const startLeft = element.offsetLeft;
            const startTop = element.offsetTop;

            function onMove(ev) {
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;

                let newWidth = startWidth;
                let newHeight = startHeight;
                let newLeft = startLeft;
                let newTop = startTop;

                if (corner.includes('e')) {
                    newWidth = Math.max(20, startWidth + dx);
                }
                if (corner.includes('w')) {
                    newWidth = Math.max(20, startWidth - dx);
                    newLeft = startLeft + (startWidth - newWidth);
                }
                if (corner.includes('s')) {
                    newHeight = Math.max(20, startHeight + dy);
                }
                if (corner.includes('n')) {
                    newHeight = Math.max(20, startHeight - dy);
                    newTop = startTop + (startHeight - newHeight);
                }

                element.style.width = newWidth + 'px';
                element.style.height = newHeight + 'px';
                element.style.left = newLeft + 'px';
                element.style.top = newTop + 'px';
            }

            function onUp() {
                const elementId = parseInt(element.getAttribute('data-id'));
                const elementData = elementsMetaData.find(d => d.id === elementId);
                if (elementData) {
                    elementData.width = element.style.width;
                    elementData.height = element.style.height;
                    elementData.left = element.style.left;
                    elementData.top = element.style.top;
                    syncLocalStorage();
                }
                document.removeEventListener('pointermove', onMove);
                document.removeEventListener('pointerup', onUp);
            }

            document.addEventListener('pointermove', onMove);
            document.addEventListener('pointerup', onUp);
        });
    });
}

function attachRotateListener(element) {
    const rotateHandle = element.querySelector('.rotate-handle');
    if (!rotateHandle) return;

    rotateHandle.addEventListener('pointerdown', (e) => {
        e.stopPropagation();

        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        function onMove(ev) {
            const angle = Math.atan2(ev.clientY - centerY, ev.clientX - centerX);
            const degrees = angle * (180 / Math.PI) + 90;
            element.style.transform = `rotate(${degrees}deg)`;
        }

        function onUp() {
            const elementId = parseInt(element.getAttribute('data-id'));
            const elementData = elementsMetaData.find(d => d.id === elementId);
            if (elementData) {
                elementData.transform = element.style.transform;
                syncLocalStorage();
            }
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
        }

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
    });
}

function makeElementSelected() {
    selectedElement.classList.add('selected-element');
    selectedLayer.classList.add('selected-layer');
    colorSelector.value = rgbToHex(selectedElement.style.backgroundColor);
    colorSelector.addEventListener('input', (e) => {
        selectedElement.style.backgroundColor = e.target.value;
        const elementId = parseInt(selectedElement.getAttribute('data-id'));
        const elementData = elementsMetaData.find(d => d.id === elementId);
        if (elementData) {
            elementData.backgroundColor = e.target.value;
            syncLocalStorage();
        }
    })
    createHandles(selectedElement);
}

function removeElementSelected() {
    removeHandles();
    document.querySelectorAll('.selected-element').forEach(el => el.classList.remove('selected-element'));
    document.querySelectorAll('.selected-layer').forEach(el => el.classList.remove('selected-layer'));
    selectedElement = null;
    selectedLayer = null;
}

layersContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('layer-item')) {
        if (selectedElement === canvas.querySelector(`[data-id="${e.target.getAttribute('data-idLayer')}"]`)) {
            removeElementSelected();
            return;
        }
        removeElementSelected();
        selectedElement = canvas.querySelector(`[data-id="${e.target.getAttribute('data-idLayer')}"]`);
        selectedLayer = e.target;
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
        let card = e.target.closest('.card');
        if (!card) return;

        isDragging = false;
        dragStartX = e.clientX;
        dragStartY = e.clientY;

        const rect = card.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        function onPointerMove(ev) {
            if (ev.pointerId !== e.pointerId) return;

            const dragDistance = Math.sqrt(
                Math.pow(ev.clientX - dragStartX, 2) +
                Math.pow(ev.clientY - dragStartY, 2)
            );

            if (dragDistance > 5) {
                isDragging = true;
            }

            const canvasRect = canvas.getBoundingClientRect();
            const cardWidth = card.offsetWidth;
            const cardHeight = card.offsetHeight;

            let left = ev.clientX - offsetX;
            let top = ev.clientY - offsetY;
            const minLeft = 0;
            const minTop = 0;
            const maxLeft = canvasRect.width - cardWidth;
            const maxTop = canvasRect.height - cardHeight;

            left = Math.max(minLeft, Math.min(left, maxLeft));
            top = Math.max(minTop, Math.min(top, maxTop));

            card.style.left = left + 'px';
            card.style.top = top + 'px';
        }

        canvas.addEventListener('pointermove', onPointerMove);

        function cleanup() {
            const elementId = parseInt(card.getAttribute('data-id'));
            const elementData = elementsMetaData.find(data => data.id === elementId);

            if (elementData) {
                elementData.left = card.style.left;
                elementData.top = card.style.top;
                syncLocalStorage();
            }

            canvas.removeEventListener('pointermove', onPointerMove);
            canvas.removeEventListener('pointerup', cleanup);

            setTimeout(() => {
                isDragging = false;
            }, 10);
        }
        canvas.addEventListener('pointerup', cleanup);
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
        newElement.classList.add('card');
        newElement.style.top = `${e.y}px`;
        newElement.style.left = `${e.x}px`;
        newElement.style.height = `${height}px`;
        newElement.style.width = `${width}px`;
        newElement.style.backgroundColor = color;
        newElement.style.zIndex = Zindex++;
        newElement.style.padding = '0.5rem';
        newElement.style.position = 'absolute';
        newElement.style.borderRadius = '1rem';
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

    if (isDragging) {
        return;
    }

    if (verticalPanel.contains(e.target) || horizontalPanel.contains(e.target)) {
        return;
    }

    const clickedElement = e.target.closest('[data-id]');

    if (clickedElement && clickedElement !== canvas) {
        const id = clickedElement.getAttribute('data-id');

        if (selectedElement === clickedElement) {
            removeElementSelected();
        } else {
            removeElementSelected();
            selectedElement = clickedElement;
            selectedLayer = layersContainer.querySelector(`[data-idLayer="${id}"]`);
            makeElementSelected();

            canvas.focus();
        }
    } else {
        removeElementSelected();
    }
})

canvas.addEventListener('keydown', (e) => {
    if (!selectedElement) {
        return;
    }

    const elementId = parseInt(selectedElement.getAttribute('data-id'));
    const step = 5;
    let moved = false;

    if (e.key === 'Delete' || e.key === 'Backspace') {
        selectedElement.remove();
        elementsMetaData = elementsMetaData.filter(data => data.id !== elementId);
        syncLayers();
        syncLocalStorage();
        selectedElement = null;
        removeElementSelected();
        return;
    }

    if (e.key === 'ArrowUp') {
        selectedElement.style.top = (parseInt(selectedElement.style.top) - step) + 'px';
        moved = true;
    } else if (e.key === 'ArrowDown') {
        selectedElement.style.top = (parseInt(selectedElement.style.top) + step) + 'px';
        moved = true;
    } else if (e.key === 'ArrowLeft') {
        selectedElement.style.left = (parseInt(selectedElement.style.left) - step) + 'px';
        moved = true;
    } else if (e.key === 'ArrowRight') {
        selectedElement.style.left = (parseInt(selectedElement.style.left) + step) + 'px';
        moved = true;
    }

    if (moved) {
        const elementData = elementsMetaData.find(d => d.id === elementId);
        if (elementData) {
            elementData.top = selectedElement.style.top;
            elementData.left = selectedElement.style.left;
            syncLocalStorage();
        }
    }
});

editButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (!selectedElement) {
            return;
        }
        const layerFunction = button.getAttribute('data-layerFunction');
        if (layerFunction === 'up') {
            if (parseInt(selectedElement.getAttribute('data-id')) === layersMetaData[0].id) {
                return;
            }
            for (let i = 0; i < layersMetaData.length; i++) {
                if (layersMetaData[i].id === parseInt(selectedElement.getAttribute('data-id'))) {
                    let tempZIndex = layersMetaData[i].zIndex;
                    layersMetaData[i].zIndex = layersMetaData[i - 1].zIndex;
                    layersMetaData[i - 1].zIndex = tempZIndex;

                    const element1 = canvas.querySelector(`[data-id="${layersMetaData[i].id}"]`);
                    const element2 = canvas.querySelector(`[data-id="${layersMetaData[i - 1].id}"]`);
                    if (element1) element1.style.zIndex = layersMetaData[i].zIndex;
                    if (element2) element2.style.zIndex = layersMetaData[i - 1].zIndex;

                    elementsMetaData = [...layersMetaData];
                    break;
                }
            }
            syncLayers();
            if (selectedElement) {
                const id = selectedElement.getAttribute('data-id');
                selectedLayer = layersContainer.querySelector(`[data-idLayer="${id}"]`);
                if (selectedLayer) selectedLayer.classList.add('selected-layer');
            }
        } else if (layerFunction === 'down') {
            if (parseInt(selectedElement.getAttribute('data-id')) === layersMetaData[layersMetaData.length - 1].id) {
                return;
            }
            for (let i = 0; i < layersMetaData.length; i++) {
                if (layersMetaData[i].id === parseInt(selectedElement.getAttribute('data-id'))) {
                    let tempZIndex = layersMetaData[i].zIndex;
                    layersMetaData[i].zIndex = layersMetaData[i + 1].zIndex;
                    layersMetaData[i + 1].zIndex = tempZIndex;

                    // Update DOM elements z-index in real-time
                    const element1 = canvas.querySelector(`[data-id="${layersMetaData[i].id}"]`);
                    const element2 = canvas.querySelector(`[data-id="${layersMetaData[i + 1].id}"]`);
                    if (element1) element1.style.zIndex = layersMetaData[i].zIndex;
                    if (element2) element2.style.zIndex = layersMetaData[i + 1].zIndex;

                    elementsMetaData = [...layersMetaData];
                    break;
                }
            }
            syncLayers();
            if (selectedElement) {
                const id = selectedElement.getAttribute('data-id');
                selectedLayer = layersContainer.querySelector(`[data-idLayer="${id}"]`);
                if (selectedLayer) selectedLayer.classList.add('selected-layer');
            }
        }
        syncLocalStorage();
    })
}) 