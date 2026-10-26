// QuizDAW · lógica de la página
let usuario = null;
let preguntas = [];
let indice = 0;
let puntos = 0;
let inicio = 0;
let respondida = false;

/* ---------- Usuario y apariencia ---------- */
function pedirNombre() {
  return prompt("¿Cómo te llamas?").trim() || "invitado";
}

function aplicarTema() {
  // ERROR1 : document.body.class no existe, la propiedad correcta es className
  document.body.className = usuario.tema === "oscuro" ? "oscuro" : "";
}

function cambiarTema() {
  usuario.tema = usuario.tema === "oscuro" ? "claro" : "oscuro";
  guardarCookie("usuario", usuario, 30);
  aplicarTema();
}

/* ---------- Datos del navegador ---------- */
function datosDelNavegador() {
  return {
    // ERROR2 : document.innerWidth no existe

    ventana: window.innerWidth + " × " + window.innerHeight,
    idioma: navigator.language,
    // ERROR3 : window.title no es una propiedad estándar
    pagina: document.title,
    ruta: location.pathname
  };
}

function pintarInfo() {
  const d = datosDelNavegador();
  document.getElementById("info").textContent =
    "Ventana: " + d.ventana + " · Idioma: " + d.idioma + " · Página: " + d.pagina + " · Ruta: " + d.ruta;
}

/* ---------- Preguntas al azar ---------- */
function elegirPreguntas(todas, cuantas) {
  const disponibles = [...todas];
  const elegidas = [];
  while (elegidas.length < Math.min(cuantas, todas.length)) {
    // ERROR4 : Math.floor(Math.random() * disponibles.length) + 1 podía provocar un índice fuera de rango (OutOfBounds)
    const posicion = Math.floor(Math.random() * disponibles.length);
    elegidas.push(disponibles.splice(posicion, 1)[0]);
  }
  return elegidas;
}

/* ---------- La partida ---------- */
function mostrarSeccion(id, visible) {
  document.getElementById(id).hidden = !visible;
}

function iniciarPartida() {
  // ERROR5 : PREGUNTAS se usa aquí pero debe estar definida de forma global 
  preguntas = elegirPreguntas(PREGUNTAS, 5);
  indice = 0;
  puntos = 0;
  inicio = Date.now();
  mostrarSeccion("inicio", false);
  mostrarSeccion("final", false);
  mostrarSeccion("juego", true);
  mostrarPregunta();
}

function mostrarPregunta() {
  const q = preguntas[indice];
  respondida = false;
  document.title = "QuizDAW · " + (indice + 1) + "/" + preguntas.length;
  document.getElementById("textoPregunta").textContent = (indice + 1) + "/" + preguntas.length + " · " + q.pregunta;

  const contenedor = document.getElementById("opciones");
  contenedor.innerHTML = "";
  q.opciones.forEach((texto, i) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "opcion";
    boton.textContent = texto;
    boton.dataset.i = i;
    contenedor.appendChild(boton);
  });

  document.getElementById("feedback").textContent = "";
  document.getElementById("btnSiguiente").hidden = true;
  document.getElementById("marcador").textContent = "Puntos: " + puntos;
}

function manejarOpcion(evento) {
  const dato = evento.target.dataset.i;
  if (dato === undefined || respondida) return;
  responder(dato);
}

function responder(i) {
  respondida = true;
  const q = preguntas[indice];
  const botones = document.getElementById("opciones").children;
  
  // ERROR6 : 'i' viene de dataset como string y q.correcta es number
  const acierto = Number(i) === q.correcta;
  if (acierto) puntos++;

  botones[q.correcta].className = "opcion ok";
  if (!acierto) botones[Number(i)].className = "opcion mal";
  document.getElementById("feedback").textContent =
    acierto ? "¡Correcto!" : "Incorrecto. La respuesta era: " + q.opciones[q.correcta];
  document.getElementById("marcador").textContent = "Puntos: " + puntos;

  const siguiente = document.getElementById("btnSiguiente");
  siguiente.textContent = indice === preguntas.length - 1 ? "Ver resultado" : "Siguiente";
  siguiente.hidden = false;
}

function siguiente() {
  indice++;
  if (indice < preguntas.length) mostrarPregunta();
  else terminar();
}

function terminar() {
  const segundos = Math.round((Date.now() - inicio) / 1000);
  // ERROR7 : Requiere que la clase Partida esté disponible globalmente
  const partida = new Partida(usuario.nombre, puntos, preguntas.length, new Date().toISOString(), segundos);
  guardarPartida(partida);

  mostrarSeccion("juego", false);
  mostrarSeccion("final", true);
  document.title = "QuizDAW";
  document.getElementById("textoFinal").textContent = partida.resumen();
  pintarPartidas();
}

/* ---------- Lista de partidas y ventana de resultados ---------- */
function pintarPartidas() {
  const partidasCrudas = cargarPartidas();
  const partidas = partidasCrudas.map(p => new Partida(p.nombre, p.puntos, p.total, p.fecha, p.segundos));
  const lista = document.getElementById("listaPartidas");
  lista.innerHTML = "";
  for (const p of partidas) {
    const li = document.createElement("li");
    li.textContent = p.resumen();
    lista.appendChild(li);
  }
  document.getElementById("media").textContent =
    partidas.length > 0 ? "Media: " + mediaPuntos(partidas).toFixed(1) + " puntos" : "Aún no hay partidas.";
}

function abrirResultados() {
  window.open("resultados.html", "resultados", "popup=yes,width=520,height=460");
}

/* ---------- Arranque ---------- */
function iniciar() {
  usuario = leerCookie("usuario", null);
  if (usuario === null) {
    usuario = { nombre: pedirNombre(), tema: "claro" };
    guardarCookie("usuario", usuario, 30);
  }
  document.getElementById("saludo").textContent = "Hola, " + usuario.nombre;
  aplicarTema();
  pintarPartidas();
  pintarInfo();

  document.getElementById("btnEmpezar").addEventListener("click", iniciarPartida);
  document.getElementById("btnOtra").addEventListener("click", iniciarPartida);
  document.getElementById("btnSiguiente").addEventListener("click", siguiente);
  document.getElementById("opciones").addEventListener("click", manejarOpcion);
  document.getElementById("btnTema").addEventListener("click", cambiarTema);
  document.getElementById("btnFavorita").addEventListener("click", guardarFavorita); 
  pintarFavoritas();
  
  // ERROR8 : Al poner 'abrirResultados()' con paréntesis, se ejecutaba inmediatamente al cargar la página
  document.getElementById("btnResultados").addEventListener("click", abrirResultados);
  
  document.getElementById("btnBorrar").addEventListener("click", manejarBorrar);
}
document.addEventListener("DOMContentLoaded", iniciar);

function guardarFavorita() {
  const partidas = cargarPartidas();
  if (partidas.length === 0) {
    alert("Tienes que jugar una partida primero para poder destacarla.");
    return;
  }

  const ultima = partidas[0];
  const favoritas = leerCookie("favoritas", []);

  favoritas.push({ 
    jugador: ultima.nombre, 
    puntos: ultima.puntos, 
    total: ultima.total 
  });

  guardarCookie("favoritas", favoritas, 30);
  pintarFavoritas();
}

function pintarFavoritas() {
  const favoritas = leerCookie("favoritas", []);
  if (favoritas.length === 0) return;

  let contenedor = document.getElementById("zonaFavoritas");
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.id = "zonaFavoritas";
    contenedor.className = "card";
    document.querySelector("footer").before(contenedor);
  }

  let html = "<h2>Partidas Destacadas</h2><ul>";
  for (const fav of favoritas) {
    html += "<li>" + fav.jugador + " logró " + fav.puntos + " de " + fav.total + " puntos.</li>";
  }
  html += "</ul>";
  
  contenedor.innerHTML = html;
}