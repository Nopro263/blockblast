const ELEMENTS = [
    [
        0b00000,
        0b00000,
        0b00100,
        0b00000,
        0b00000
    ],
    [
        0b00000,
        0b01110,
        0b01110,
        0b01110,
        0b00000
    ],
    [
        0b00100,
        0b00100,
        0b00100,
        0b00100,
        0b00100
    ],
    [
        0b00000,
        0b00000,
        0b11111,
        0b00000,
        0b00000
    ],
    [
        0b00000,
        0b00100,
        0b00100,
        0b01100,
        0b00000
    ],
]

const COLORS = [
    "orange",
    "violet",
    "lightgreen",
    "teal",
    "cyan",
    "lightcoral",
    "coral"
]

const getLines = () => {
    const ret = {
        "vertical": [],
        "horizontal": []
    }

    for (let a = 0; a < gameboard.children.length; a++) {
        const element = gameboard.children[a];
        let v = true;
        for (let b = 0; b < element.children.length; b++) {
            const e = element.children[b];
            if(!e.style.getPropertyValue("--color")) {
                v = false;
                break;
            }
        }

        if(v) {
            ret["horizontal"].push(a);
        }
        
    }

    for (let b = 0; b < 10; b++) {
        let v = true;
        for (let a = 0; a < gameboard.children.length; a++) {
            const element = gameboard.children[a].children[b];
            if(!element.style.getPropertyValue("--color")) {
                v = false;
                break;
            }
        }

        if(v) {
            ret["vertical"].push(b);
        }
    }

    return ret;
}

const getRelLocation = (element) => {
    const loc = [NaN, NaN];

    for (let index = 0; index < element.parentElement.children.length; index++) {
        const e = element.parentElement.children[index];
        if (e === element) {
            loc[1] = index;
            break;
        }
    }
    for (let index = 0; index < element.parentElement.parentElement.children.length; index++) {
        const e = element.parentElement.parentElement.children[index];
        if (e === element.parentElement) {
            loc[0] = index;
            break;
        }
    }

    return [!element.parentElement.parentElement.classList.contains("gameboard"), loc];
}

const getSquare = (element, i, index) => {
    return element.children[i].children[index];
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
            const v = (row & (0b10000 >> index)) >> (4 - index);
            const elementElement = document.createElement("div");
            elementElement.classList.add("element");
            if (v) {
                elementElement.style.setProperty("--color", color);
            }
            //elementElement.innerHTML = v;
            rowElement.appendChild(elementElement);
        }
    });

    element.addEventListener("dragstart", (ev) => {
        if(!ev.explicitOriginalTarget.classList.contains("element")) {
            ev.preventDefault();
            return;
        }
        console.log(ev);
        const [_, grabbingElement] = getRelLocation(ev.explicitOriginalTarget);
        const dragging = document.querySelector("#dragging");
        if (dragging) {
            dragging.id = "";
        }
        ev.target.id = "dragging";
        ev.dataTransfer.setData("text", JSON.stringify({ source, grabbingElement, color }));
        cleanElements();
    })

    element.addEventListener("dragend", (ev) => {cleanElements();})

    return element;
}

const insertElement = (source, color, targetElement, pos, p = "--color") => {
    const actions = []

    for (let i = 0; i < 5; i++) {
        const row = source[i];
        for (let index = 0; index < 5; index++) {
            const v = (row & (0b10000 >> index)) >> (4 - index);
            if (i + pos[0] < 0 || i + pos[0] >= 10 || index + pos[1] < 0 || index + pos[1] >= 10) {
                // invalid position
                if (v) {
                    return false;
                }
            } else {
                if (v) {
                    const targetSquare = getSquare(targetElement, i + pos[0], index + pos[1]);
                    if (targetSquare.style.getPropertyValue("--color")) {
                        return false; // occupied
                    } else {
                        actions.push(targetSquare);
                    }
                }
            }
        }
    }

    actions.forEach((v) => {
        v.style.setProperty(p, color);
    });

    return true;
}

const cleanElements = () => {
    for (let a = 0; a < gameboard.children.length; a++) {
        const element = gameboard.children[a];
        for (let b = 0; b < element.children.length; b++) {
            const e = element.children[b];
            e.style.removeProperty("--default-color");
        }
    }
}

const sources = document.querySelector("#sources");
const gameboard = document.querySelector(".gameboard");

gameboard.addEventListener("dragover", (ev) => {
    ev.preventDefault();

    cleanElements();
    const { source, grabbingElement, color } = JSON.parse(ev.dataTransfer.getData("text"));

    const [ex, gbPos] = getRelLocation(ev.explicitOriginalTarget);
    if(ex) {
        ev.preventDefault();
        return;
    }
    const pos = [gbPos[0] - grabbingElement[0], gbPos[1] - grabbingElement[1]]

    insertElement(source, "yellow", gameboard, pos, "--default-color");
});

gameboard.addEventListener("drop", (ev) => {
    const { source, grabbingElement, color } = JSON.parse(ev.dataTransfer.getData("text"));

    cleanElements();

    const [ex, gbPos] = getRelLocation(ev.explicitOriginalTarget);
    if(ex) {
        ev.preventDefault();
        return;
    }
    const pos = [gbPos[0] - grabbingElement[0], gbPos[1] - grabbingElement[1]]

    if (insertElement(source, color, gameboard, pos)) {
        const dragging = document.querySelector("#dragging");
        dragging.parentElement.removeChild(dragging);

        afterDrop();
    }


})

ELEMENTS.forEach((element) => {
    sources.appendChild(generateSource(element, "red"));
})

const afterDrop = () => {
    const { vertical, horizontal } = getLines();

    horizontal.forEach((v) => {
        const e = gameboard.children[v];
        for (let index = 0; index < e.children.length; index++) {
            const element = e.children[index];
            element.style.removeProperty("--color");
        }
    })

    vertical.forEach((v) => {
        for (let index = 0; index < 10; index++) {
            const element = gameboard.children[index].children[v];
            element.style.removeProperty("--color");
        }
    })

    cleanElements();
}