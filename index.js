const ELEMENTS = [
    [
        0b00000,
        0b00100,
        0b01110,
        0b00100,
        0b00000
    ]
]

const getRelLocation = (element) => {
    const loc = [NaN, NaN];

    for (let index = 0; index < element.parentElement.children.length; index++) {
        const e = element.parentElement.children[index];
        if(e === element) {
            loc[1] = index;
            break;
        }
    }
    for (let index = 0; index < element.parentElement.parentElement.children.length; index++) {
        const e = element.parentElement.parentElement.children[index];
        if(e === element.parentElement) {
            loc[0] = index;
            break;
        }
    }

    return loc;
}

const generateSource = (source, color) => {
    const element = document.createElement("div");
    element.classList.add("source");
    element.draggable = true;

    source.forEach(row => {
        const rowElement = document.createElement("div");
        rowElement.classList.add("row");
        element.appendChild(rowElement);

        for (let index = 0; index < 5; index++) {
            const v = (row & (0b10000 >> index)) >> (4-index);
            const elementElement = document.createElement("div");
            elementElement.classList.add("element");
            if(v) {
                elementElement.style.setProperty("--color", color);
            }
            //elementElement.innerHTML = v;
            rowElement.appendChild(elementElement);
        }
    });

    element.addEventListener("dragstart", (ev) => {
        console.log(ev);
        const grabbingElement = getRelLocation(ev.explicitOriginalTarget);
        ev.target.id = "dragging";
        ev.dataTransfer.setData("text", JSON.stringify({source, grabbingElement}));
    })

    return element;
}

const insertElement = (source, targetElement, pos) => {
    console.log(source, targetElement, pos)
    for (let i = 0; i < 5; i++) {
        const row = source[i];
        for (let index = 0; index < 5; index++) {
            const v = (row & (0b10000 >> index)) >> (4-index);
            if(i+pos[0] < 0 || i+pos[0] >= 10 || index+pos[1] < 0 || index+pos[1] >= 10) {
                // invalid position
                if(v) {
                    return false;
                }
            } else {
                
            }
        }
    }

    return true;
}

const sources = document.querySelector("#sources");
const gameboard = document.querySelector(".gameboard");

sources.appendChild(generateSource(ELEMENTS[0], "red"));

gameboard.addEventListener("dragover", (ev) => {
    ev.preventDefault();
});

gameboard.addEventListener("drop", (ev) => {
    const {source, grabbingElement} = JSON.parse(ev.dataTransfer.getData("text"));

    const gbPos = getRelLocation(ev.explicitOriginalTarget);
    const pos = [gbPos[0]-grabbingElement[0], gbPos[1]-grabbingElement[1]]

    console.log(insertElement(source, gameboard, pos));

    const dragging = document.querySelector("#dragging");
    dragging.parentElement.removeChild(dragging);
})