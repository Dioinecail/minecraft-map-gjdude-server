var mapChunkHtml = null;
var mapData = [];

var currentMapPosition = {
    x: 0,
    y: 0
};

var currentZoom = 1;

var isPointerDown = false;
var mapRoot = document.querySelector('.map-root');
var body = document.querySelector('body');



async function loadMap() {
    fetch('./src/components/mapChunk.html')
        .then((response) => response.text())
        .then((html) => {
            mapChunkHtml = html;

            fetchMaps();
        });
}

async function fetchMaps() {
    for (let x = -30; x < 30; x++) {
        for (let y = -30; y < 30; y++) {
            await fetchMapPng(`./result/${x},${y}.png`, x, y);
        }
    }
}

async function fetchMapPng(url, x, y) {
    const response = await fetch(url);

    if (!response.ok) {
        return;
    }

    // const image = response.blob();

    // const imageUrl = URL.createObjectURL(image);

    let div = document.createElement('div');
    let chunkId = `id-${x}-${y}`;

    document.querySelector('.map-root').appendChild(div);

    div.outerHTML = mapChunkHtml.replace('{chunk-id}', chunkId);

    let chunkDiv = document.querySelector(`#${chunkId}`);

    chunkDiv.querySelector('img').src = url;
    chunkDiv.style.position = 'absolute';
    chunkDiv.style.left = `${x * 512}px`;
    chunkDiv.style.top = `${y * 512}px`;
}

function handlePointerDown(evt) {
    isPointerDown = true;
}

function handlePointerUp(evt) {
    isPointerDown = false;
}

function handlePointerMove(evt) {
    if (!isPointerDown)
        return;

    currentMapPosition.x += evt.movementX / currentZoom;
    currentMapPosition.y += evt.movementY / currentZoom;

    mapRoot.style.left = `${currentMapPosition.x}px`;
    mapRoot.style.top = `${currentMapPosition.y}px`;
}

function handleScroll(evt) {
    let zoom = evt.wheelDeltaY / 200;


    if (currentZoom <= 1) {
        let sign = Math.sign(zoom / 10);
        let clampedZoom = Math.min(0.05, Math.abs(zoom / 10));

        currentZoom += (clampedZoom * sign);
    }
    else {
        currentZoom += zoom;
    }

    currentZoom = Math.max(0.05, currentZoom);

    body.style.zoom = currentZoom;
}

loadMap();

document.addEventListener('pointerdown', handlePointerDown);
document.addEventListener('pointerup', handlePointerUp);
document.addEventListener('pointermove', handlePointerMove);

document.addEventListener('wheel', handleScroll);
