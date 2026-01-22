const createButtons = document.querySelectorAll('.createButton');
const canvas = document.querySelector('.canvas');
const verticalPanel = document.querySelector('.vertical-panel');
const colorSelector = document.querySelector('.color-selector');
let selectedButton = null;
let color = colorSelector.value;
let Zindex = null;
let elementsMetaData = null;
let uniqueIdCounter = null;

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

verticalPanel.addEventListener('click', (e) => {
    e.stopPropagation();
});

canvas.addEventListener('pointerdown', (e) => {
    if (!selectedButton) {
        return;
    }

    const handlePointerUp = (ev) => {
        let height = ev.y - e.y;
        let width = ev.x - e.x;
        const newElement = document.createElement('div');
        newElement.style.top = `${e.y}px`;
        newElement.style.left = `${e.x}px`;
        newElement.style.height = `${height}px`;
        newElement.style.width = `${width}px`;
        newElement.style.backgroundColor = color;
        newElement.style.zIndex = Zindex++;
        newElement.style.position = 'absolute'

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
            })
            syncLocalStorage();
        }
        canvas.appendChild(newElement);
        document.body.style.cursor = 'default';
        selectedButton.classList.remove('selectedButton');
        selectedButton = null;

        canvas.removeEventListener('pointerup', handlePointerUp);
    };

    canvas.addEventListener('pointerup', handlePointerUp);
})

colorSelector.addEventListener('input', (e) => {
    color = e.target.value;
})