const ELEMENTS = [
    [
        0b00000,
        0b00000,
        0b00100,
        0b00000,
        0b00000,
        "red"
    ],
    [
        0b00000,
        0b01110,
        0b01110,
        0b01110,
        0b00000,
        "violet"
    ],
    [
        0b00100,
        0b00100,
        0b00100,
        0b00100,
        0b00100,
        "cyan"
    ],
    [
        0b00000,
        0b00000,
        0b11111,
        0b00000,
        0b00000,
        "lightgreen"
    ],
    [
        0b00000,
        0b00100,
        0b00100,
        0b01100,
        0b00000,
        "coral"
    ],
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

    element.addEventListener("dragend", (ev) => {
        cleanElements();
        const dragging = document.querySelector("#dragging");
        if (dragging) {
            dragging.id = "";
        }
    })

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
const countElement = document.querySelector("#count");
let count = 0;
let multiplier = 1;

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

const pick3 = () => {
    const shuffled = ELEMENTS.sort(() => 0.5 - Math.random());
    for (let index = 0; index < 3; index++) {
        const element = shuffled[index];
        const e = generateSource(element, element[5]);
        e.setAttribute("data-id", ELEMENTS.indexOf(element));
        sources.appendChild(e);
    }
}

const check = (source) => {
    const canInsertElement = (source, targetElement, pos) => {
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

    
        return true;
    }

    for (let a = -6; a < 16; a++) {
        for (let b = -6; b < 16; b++) {
            //console.log("d", [a,b])
            if(canInsertElement(source, gameboard, [a,b])) {
                return true;
            }
        }
    }

    return false;
}

pick3();

const afterDrop = () => {
    const { vertical, horizontal } = getLines();

    multiplier = vertical.length + horizontal.length;

    horizontal.forEach((v) => {
        const e = gameboard.children[v];
        for (let index = 0; index < e.children.length; index++) {
            const element = e.children[index];
            element.style.removeProperty("--color");
        }

        count += multiplier * 10;
    })

    vertical.forEach((v) => {
        for (let index = 0; index < 10; index++) {
            const element = gameboard.children[index].children[v];
            element.style.removeProperty("--color");
        }

        count += multiplier * 9;
    })

    countElement.innerHTML = count;

    cleanElements();

    if(!sources.children.length) {
        pick3();
    }

    let possible = false;

    for (let index = 0; index < sources.children.length; index++) {
        const element = sources.children[index];
        if(check(ELEMENTS[parseInt(element.getAttribute("data-id"))])) {
            possible = true;
        }
    }

    if(!possible) {
        if(!localStorage.getItem("score") || count > parseInt(localStorage.getItem("score"))) {
            alert("New highscore! " + count);
            localStorage.setItem("score", count);
        } else {
            alert("You Lost, you scored: " + count);
        }
        window.location.reload();
    }
}