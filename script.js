document.addEventListener("DOMContentLoaded", function () {
    let locationMarker = null;

    let map = L.map("map-container").setView([53.430127, 14.564802], 18);

    L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
            maxZoom: 19,
            attribution:
                "Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        }
    ).addTo(map);

    function generateMapGrid() {
        const mapContainer = document.getElementById("map-container");
        ["horizontal", "vertical"].forEach((type, i) => {
            for (let j = 1; j < 4; j++) {
                const line = document.createElement("div");
                line.className = "grid-line";
                if (type === "horizontal") {
                    line.style.top = `${j * 25}%`;
                    line.style.left = "0";
                    line.style.width = "100%";
                    line.style.height = "1px";
                } else {
                    line.style.left = `${j * 25}%`;
                    line.style.top = "0";
                    line.style.width = "1px";
                    line.style.height = "100%";
                }
                line.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
                mapContainer.appendChild(line);
            }
        });
    }


    document.getElementById("get-location").addEventListener("click", function () {
        if (!navigator.geolocation) {
            alert("Geolokalizacja nie jest wspierana przez Twoją przeglądarkę.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                console.log(`Latitude: ${lat}, Longitude: ${lon}`);

                if (locationMarker) {
                    locationMarker.setLatLng([lat, lon]);
                } else {
                    locationMarker = L.marker([lat, lon]).addTo(map).bindPopup("Twoja lokalizacja").openPopup();
                }
                map.setView([lat, lon], 19);
            },
            error => {
                const errorMessages = {
                    1: "Brak dostępu do lokalizacji. Włącz GPS lub udziel zgody.",
                    2: "Lokalizacja niedostępna.",
                    3: "Przekroczono czas oczekiwania na lokalizację.",
                };
                alert(errorMessages[error.code] || "Nie udało się uzyskać lokalizacji.");
                console.error("Geolocation error:", error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    });

    generateMapGrid();

    document.getElementById("save-map").addEventListener("click", function () {
        leafletImage(map, function (err, canvas) {
            if (err) return;

            const imageURL = canvas.toDataURL("image/png");
            const puzzleContainer = document.getElementById("puzzle-container");
            puzzleContainer.innerHTML = "";

            const pieceWidth = 200;
            const pieceHeight = 125;
            const pieces = [];

            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 4; x++) {
                    const piece = document.createElement("div");
                    piece.className = "puzzle-piece";
                    piece.style.backgroundImage = `url(${imageURL})`;
                    piece.style.backgroundPosition = `-${x * pieceWidth}px -${y * pieceHeight}px`;
                    piece.setAttribute("data-original-index", y * 4 + x);
                    pieces.push(piece);
                }
            }

            shuffle(pieces).forEach((piece) => puzzleContainer.appendChild(piece));

            const gridContainer = document.getElementById("grid-container");
            gridContainer.innerHTML = "";

            for (let i = 0; i < 16; i++) {
                const cell = document.createElement("div");
                cell.className = "grid-cell";
                cell.setAttribute("data-index", i);
                gridContainer.appendChild(cell);
            }

            initializeDragAndDrop();
        });
    });

    function initializeDragAndDrop() {
        const puzzlePieces = document.querySelectorAll(".puzzle-piece");
        const gridCells = document.querySelectorAll(".grid-cell");

        puzzlePieces.forEach((piece) => {
            piece.setAttribute("draggable", "true");

            piece.addEventListener("dragstart", function (event) {
                event.dataTransfer.setData("text", this.getAttribute("data-original-index"));
            });
        });

        gridCells.forEach((cell) => {
            cell.addEventListener("dragover", function (event) {
                event.preventDefault();
            });

            cell.addEventListener("drop", function (event) {
                event.preventDefault();

                const originalIndex = event.dataTransfer.getData("text");
                const cellIndex = this.getAttribute("data-index");

                if (originalIndex === cellIndex) {
                    const piece = [...document.querySelectorAll(".puzzle-piece")].find(
                        (p) => p.getAttribute("data-original-index") === originalIndex
                    );
                    if (piece) {
                        this.appendChild(piece);
                        this.style.border = "none";
                        checkPuzzleCompletion();
                    }
                }
            });

        });
    }

    function checkPuzzleCompletion() {
        const gridCells = document.querySelectorAll(".grid-cell");
        const isComplete = [...document.querySelectorAll(".grid-cell")].every(cell => {
            const piece = cell.firstChild;
            return piece?.getAttribute("data-original-index") === cell.getAttribute("data-index");
        });

        if (isComplete) {
            setTimeout(() => {
                console.log("Ułożono poprawnie wszystkie puzzle!");
                if (Notification.permission === "granted") {
                    new Notification("Gratulacje!", {
                        body: "Ułożyłeś poprawnie wszystkie puzzle!",
                    });
                } else {
                    alert("Gratulacje! Ułożono poprawnie wszystkie puzzle!");
                }
            }, 10);
        }
    }
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
});
