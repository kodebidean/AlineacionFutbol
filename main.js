      // Esperar a que se cargue completamente la página
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Firebase con la configuración proporcionada en firebase-config.js
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
  
    // Constantes para las posiciones en el tablero táctico
    const POSICIONES = {
      PT: { left: '2%', top: '40%' },    // Portero
      DF1: { left: '15%', top: '25%' },  // Defensa 1
      DF2: { left: '15%', top: '55%' },  // Defensa 2
      DF3: { left: '20%', top: '5%' },  // Defensa 3
      DF4: { left: '20%', top: '80%' },  // Defensa 4
      MD1: { left: '35%', top: '40%' },  // Mediocampista Defensivo
      MC1: { left: '50%', top: '25%' },  // Mediocampista 1
      MC2: { left: '50%', top: '55%' },  // Mediocampista 2
      MO1: { left: '65%', top: '40%' },   // Mediocampista Ofensivo
      DL1: { left: '85%', top: '20%' },  // Delantero 1
      DL2: { left: '85%', top: '60%' }   // Delantero 2
    };
  
    // Constantes para las posiciones fuera del campo para suplentes
    const POSICIONES_FUERA = {
      suplente1: { left: '5%', top: '80%' },
      suplente2: { left: '15%', top: '80%' },
      suplente3: { left: '25%', top: '80%' },
      suplente4: { left: '35%', top: '80%' },
      suplente5: { left: '45%', top: '80%' },
      suplente6: { left: '55%', top: '80%' },
      suplente7: { left: '65%', top: '80%' },
      suplente8: { left: '75%', top: '80%' },
      suplente9: { left: '85%', top: '80%' },
      suplente10: { left: '95%', top: '80%' }
    };
  
    // Función para agregar un jugador
    function addJugador(nombre, apellido, dorsal, posicion, titular) {
      db.collection("jugadores").add({
        nombre: nombre,
        apellido: apellido,
        dorsal: dorsal,
        posicion: posicion,
        titular: titular
      })
      .then((docRef) => {
        console.log("Jugador agregado con ID: ", docRef.id);
        cargarTablero();  // Actualizar tablero después de agregar
        getJugadores();  // Actualizar lista de jugadores
      })
      .catch((error) => {
        console.error("Error añadiendo jugador: ", error);
      });
    }
  
    // Función para obtener y mostrar jugadores
    function getJugadores() {
      db.collection("jugadores").get().then((querySnapshot) => {
        const jugadoresTable = document.getElementById("jugadoresTable");
        jugadoresTable.innerHTML = ""; // Limpiar tabla antes de volver a mostrar
  
        querySnapshot.forEach((doc) => {
          const jugador = doc.data();
          const jugadorRow = document.createElement("tr");
          
          // Crear celdas para cada propiedad del jugador
          let nombreCell = document.createElement("td");
          nombreCell.textContent = jugador.nombre;
          jugadorRow.appendChild(nombreCell);
  
          let apellidoCell = document.createElement("td");
          apellidoCell.textContent = jugador.apellido;
          jugadorRow.appendChild(apellidoCell);
  
          let dorsalCell = document.createElement("td");
          dorsalCell.textContent = jugador.dorsal;
          jugadorRow.appendChild(dorsalCell);
  
          let posicionCell = document.createElement("td");
          posicionCell.textContent = jugador.posicion;
          jugadorRow.appendChild(posicionCell);
  
          // Celda para marcar como titular o suplente
          let titularSuplenteCell = document.createElement("td");
          let titularSuplenteCheckbox = document.createElement("input");
          titularSuplenteCheckbox.type = "checkbox";
          titularSuplenteCheckbox.checked = jugador.titular;
          titularSuplenteCheckbox.addEventListener("change", () => {
            cambiarTitularSuplente(doc.id, titularSuplenteCheckbox.checked);
          });
          titularSuplenteCell.appendChild(titularSuplenteCheckbox);
          jugadorRow.appendChild(titularSuplenteCell);
  
          // Celda para eliminar jugador
          let eliminarCell = document.createElement("td");
          let eliminarButton = document.createElement("button");
          eliminarButton.innerHTML = "&times;"; // Icono de X
          eliminarButton.className = "eliminar-btn";
          eliminarButton.addEventListener("click", () => eliminarJugador(doc.id));
          eliminarCell.appendChild(eliminarButton);
          jugadorRow.appendChild(eliminarCell);
  
          jugadoresTable.appendChild(jugadorRow);
        });
      });
    }
  
    // Función para limpiar el tablero táctico
    document.getElementById("limpiarTablero").addEventListener("click", () => {
      db.collection("jugadores").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          db.collection("jugadores").doc(doc.id).delete();
        });
      });
    });
  
    // Manejar el envío del formulario
    document.getElementById("jugadorForm").addEventListener("submit", function(event) {
      event.preventDefault();
      let nombre = document.getElementById("nombre").value;
      let apellido = document.getElementById("apellido").value;
      let dorsal = document.getElementById("dorsal").value;
      let posicion = document.getElementById("posicion").value;
      let titular = document.getElementById("titular").checked;
  
      if(nombre && apellido && dorsal && posicion) {
        addJugador(nombre, apellido, dorsal, posicion, titular);
        document.getElementById("jugadorForm").reset(); // Limpiar formulario después de agregar
      } else {
        alert("Todos los campos son obligatorios.");
      }
    });
  
    // Función para cambiar entre titular y suplente
    function cambiarTitularSuplente(id, esTitular) {
      db.collection("jugadores").doc(id).update({
        titular: esTitular
      }).then(() => {
        console.log("Estado actualizado correctamente");
        getJugadores(); // Actualizar lista de jugadores después de cambio
      }).catch((error) => {
        console.error("Error actualizando estado:", error);
      });
    }
  
    // Función para cargar y posicionar los jugadores en el tablero
    function cargarTablero() {
      db.collection("jugadores").get().then((querySnapshot) => {
        const tablero = document.getElementById("tablero");
        tablero.innerHTML = "";
  
        // Arrays para verificar posiciones ocupadas
        let posicionesOcupadasCampo = {
          PT: false,
          DF1: false,
          DF2: false,
          DF3: false,
          DF4: false,
          MC1: false,
          MC2: false,
          MD1: false,
          MO1: false,
          DL1: false,
          DL2: false
        };
        let posicionesOcupadasFuera = {};
  
        querySnapshot.forEach((doc) => {
          const jugador = doc.data();
          
          // Solo colocar en el tablero a los jugadores titulares
          if (jugador.titular) {
            const jugadorDiv = document.createElement("div");
            jugadorDiv.className = `jugador ${jugador.titular ? 'titular' : 'banquillo'}`;
            jugadorDiv.setAttribute("data-id", doc.id);
            jugadorDiv.textContent = jugador.dorsal;
      
            // Asignar posición en el tablero táctico
            if (POSICIONES[jugador.posicion]) {
              jugadorDiv.style.left = POSICIONES[jugador.posicion].left;
              jugadorDiv.style.top = POSICIONES[jugador.posicion].top;
              posicionesOcupadasCampo[jugador.posicion] = true; // Marcar posición como ocupada
            } else {
              // Si la posición no está definida en POSICIONES, ubicar en posición predeterminada
              jugadorDiv.style.left = '50%';
              jugadorDiv.style.top = '50%';
            }
      
            jugadorDiv.addEventListener("click", () => seleccionarJugador(doc.id, jugador));
            tablero.appendChild(jugadorDiv);
          }
        });
  
        // Función para buscar una posición libre fuera del campo
        function buscarPosicionFuera() {
          for (let key in POSICIONES_FUERA) {
            if (!posicionesOcupadasFuera[key]) {
              return key;
            }
          }
          return null; // No hay posiciones libres fuera del campo
        }
      });
    }
      // Función para eliminar jugador (del tablero y del registro)
      function eliminarJugador(id) {
        // Eliminar jugador del tablero
        db.collection("jugadores").doc(id).delete().then(() => {
          console.log("Jugador eliminado con ID: ", id);
          cargarTablero(); // Volver a cargar el tablero después de eliminar
          getJugadores(); // Actualizar lista de jugadores
        }).catch((error) => {
          console.error("Error eliminando jugador: ", error);
        });
      }
    
      // Función para seleccionar un jugador del tablero o banquillo
      function seleccionarJugador(id, jugador) {
        console.log("Jugador seleccionado:", jugador);
        // Aquí puedes implementar la lógica para interactuar con el jugador seleccionado
      }
    
      // Cargar el tablero y la lista de jugadores al cargar la página
      window.onload = () => {
        cargarTablero();
        getJugadores();
      };
    
    });