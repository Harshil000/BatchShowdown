const createButtons = document.querySelectorAll('.createButton');
const canvas = document.querySelector('.canvas');
const verticalPanel = document.querySelector('.vertical-panel');
const horizontalPanel = document.querySelector('.horizontal-panel');
const colorSelector = document.querySelector('.color-selector');
let selectedButton = null;
let color = colorSelector.value;
let Zindex = null;
let elementsMetaData = null;
let uniqueIdCounter = null;
let selectedElement = null;

if (localStorage.getItem('Zindex')) {
    Zindex = localStorage.getItem('Zindex');
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

function syncLocalStorage() {
    localStorage.setItem('elementsMetaData', JSON.stringify(elementsMetaData));
    localStorage.setItem('Zindex', Zindex);
    localStorage.setItem('uniqueIdCounter', uniqueIdCounter);
}


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
    newElement.setAttribute('data-id', data.id);
    if (data.type === 'text') {
        newElement.innerText = data.content;
    }
    canvas.appendChild(newElement);
});

function throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            func(...args);
        }
    };
}

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
            newElement.innerText = 'Edit text';
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
                content: 'Edit text',
            })
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
            })
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

colorSelector.addEventListener('input', (e) => {
    color = e.target.value;
})