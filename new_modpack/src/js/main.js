var mapChunkHtml = null;
var waypointHtml = null;
var mapData = [];

var currentMapPosition = {
    x: 0,
    y: 0
};

var currentZoom = 1;

var isPointerDown = false;
var mapRoot = document.querySelector('.map-root');
var body = document.querySelector('.body-root');
var menuRoot = document.querySelector('.menu-root');
var mapJson = null;

var menuState = false;
var waypoints = {};

var isCursorHovering = false;



async function loadMap() {
    fetch('./src/components/mapChunk.html')
        .then((response) => response.text())
        .then((html) => {
            mapChunkHtml = html;

            fetch('./data.json')
                .then((response) => response.json())
                .then((json) => {
                    mapJson = json;

                    fetchMaps();
                });
        });

    fetch('./src/components/waypoint.html')
        .then((response) => response.text())
        .then((html) => {
            waypointHtml = html;

            if (mapJson == null) {
                fetch('./data.json')
                    .then((response) => response.json())
                    .then((json) => {
                        mapJson = json;

                        processWaypoint();
                    });
            }
        });

    document.querySelector('.menu-button').addEventListener('click', (evt) => {
        menuState = !menuState;

        if (menuState)
            menuRoot.classList.remove('hidden');
        else
            menuRoot.classList.add('hidden');
    });
}

function fetchMaps() {
    mapJson.map.forEach(data => {
        const { url, x, y } = data;

        fetchMapPng(url, x, y);
    });
}

function fetchMapPng(url, x, y) {
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

function processWaypoint() {
    mapJson.waypoints.forEach(waypoint => {
        createWaypoint(waypoint);
    });
}

function createWaypoint(waypoint) {
    const { x, y, elevation, color, name, owner, id } = waypoint;

    let div = document.createElement('div');
    let waypointId = `id-${id}`;

    document.querySelector('.map-root').appendChild(div);

    div.outerHTML = waypointHtml.replace('{waypoint-id}', waypointId);

    let waypointDiv = document.querySelector(`#${waypointId}`);
    let text = `${name}\r\nWaypoint by: ${owner}\r\nCoords: [x:${x}, z:${y}, y:${elevation}]`;

    waypointDiv.querySelector('.waypoint-text').textContent = text;
    waypointDiv.querySelector('.waypoint-position').style.backgroundColor = color;
    waypointDiv.querySelector('.waypoint-text').style.color = color;
    waypointDiv.querySelector('.waypoint-text').style.display = 'none';

    waypointDiv.style.position = 'absolute';
    waypointDiv.style.left = `${x}px`;
    waypointDiv.style.top = `${y}px`;
    waypointDiv.waypointText = text;
    waypointDiv.classList.add(owner);

    if (!(owner in waypoints)) {
        waypoints[owner] = {};
        waypoints[owner].waypoints = [];
        waypoints[owner].state = false;

        let menuRoot = document.querySelector('.menu-root');
        let wpGroupOptionDiv = document.createElement('div');

        wpGroupOptionDiv.classList.add('waypoints-group-option');
        wpGroupOptionDiv.textContent = owner;
        wpGroupOptionDiv.addEventListener('click', (evt) => {
            waypoints[owner].state = !waypoints[owner].state;

            let newState = waypoints[owner].state;

            if (newState)
                wpGroupOptionDiv.classList.add('selected')
            else
                wpGroupOptionDiv.classList.remove('selected')

            let foundWaypoints = document.querySelectorAll(`.${owner}`);

            foundWaypoints.forEach(w => {
                w.querySelector('.waypoint-text').style.display = newState ? 'flex' : 'none';
            })

            document.querySelector(`#${owner}-group`).style.display = newState ? 'flex' : 'none';
        });

        menuRoot.appendChild(wpGroupOptionDiv);

        let waypointsGroup = document.createElement('div');

        waypointsGroup.classList.add('waypoints-group');
        waypointsGroup.id = `${owner}-group`;

        menuRoot.appendChild(waypointsGroup);
    }

    let wpData = {
        waypoint: waypoint,
        div: waypointDiv
    };

    let waypointsGroupDiv = menuRoot.querySelector(`#${owner}-group`);
    let waypointOptionDiv = document.createElement('div');

    waypointOptionDiv.classList.add('waypoint-option');
    waypointsGroupDiv.appendChild(waypointOptionDiv);

    waypointOptionDiv.textContent = name;
    waypointOptionDiv.addEventListener('click', (evt) => {
        currentMapPosition.x = -x;
        currentMapPosition.y = -y;

        mapRoot.style.left = `${currentMapPosition.x}px`;
        mapRoot.style.top = `${currentMapPosition.y}px`;
    });

    waypoints[owner].waypoints.push(wpData);
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
    if (isCursorHovering)
        return;

    let zoom = evt.wheelDeltaY / 200;
    let sign = Math.sign(zoom / 10);

    if (currentZoom <= 1) {
        let clampedZoom = Math.min(0.05, Math.abs(zoom / 10));

        currentZoom += (clampedZoom * sign);
    }
    else {
        currentZoom += zoom;
    }

    // currentMapPosition.x -= (512 * 0.35 / 4) * sign;
    // currentMapPosition.y -= (512 * 0.35 / 4) * sign;

    mapRoot.style.left = `${currentMapPosition.x}px`;
    mapRoot.style.top = `${currentMapPosition.y}px`;

    currentZoom = Math.max(0.05, currentZoom);

    body.style.zoom = currentZoom;
}

function handleMenuHoverEnter(evt) { 
    isCursorHovering = true;
}

function handleMenuHoverExit(evt) {
    isCursorHovering = false;
}

menuRoot.addEventListener('mouseenter', handleMenuHoverEnter);
menuRoot.addEventListener('mouseleave', handleMenuHoverExit);

loadMap();

document.addEventListener('pointerdown', handlePointerDown);
document.addEventListener('pointerup', handlePointerUp);
document.addEventListener('pointermove', handlePointerMove);

document.addEventListener('wheel', handleScroll);
