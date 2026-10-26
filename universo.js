import * as THREE from 'three'
const CARTA = { pokebola: [.08, .9] }
const progresoCarta = u => THREE.MathUtils.smoothstep(u, .12, .85)


const CALIDOS = ['#ff3b5c', '#ff6a3d', '#ffb829', '#ff4fa3', '#e8344a', '#ff8a1f']
const FRIOS = ['#f4f0ff', '#cfd8ff', '#8052ff', '#4fc3ff', '#2fe0c0', '#b9a6ff']
const BOTON = ['#ffffff', '#ffe9a8', '#ffffff', '#d8ccff']

function elegir(lista, azar) {
  return new THREE.Color(lista[Math.floor(azar() * lista.length)])
}

export function generarPuntos(cantidad, azar = Math.random) {
  const posiciones = []
  const colores = []
  const dorado = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < cantidad; i++) {
    const y = 1 - (i / (cantidad - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const a = dorado * i
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    // La franja central queda vacía: así se lee la Pokébola desde cualquier ángulo.
    if (Math.abs(y) < 0.085) continue
    const delFrente = z > 0 && Math.hypot(x, y) < 0.3
    if (delFrente && Math.hypot(x, y) < 0.2 && Math.hypot(x, y) > 0.12) continue
    const radio = 1 + (azar() - 0.5) * 0.06
    posiciones.push(x * radio, y * radio, z * radio)
    colores.push(...(delFrente ? elegir(BOTON, azar) : y > 0 ? elegir(CALIDOS, azar) : elegir(FRIOS, azar)).toArray())
  }
  for (let i = 0; i < cantidad * 0.04; i++) {
    const a = azar() * Math.PI * 2
    const r = 0.13 + azar() * 0.05
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    posiciones.push(x, y, Math.sqrt(1 - x * x - y * y) + 0.02)
    colores.push(...elegir(BOTON, azar).toArray())
  }
  return { posiciones: new Float32Array(posiciones), colores: new Float32Array(colores) }
}

// Mezclar los índices evita cortar la esfera por latitud al reducir el drawRange.
export function distribuirPokebola(cantidad, azar = Math.random) {
  const base = generarPuntos(cantidad * 2, azar)
  const indices = Array.from({ length: base.posiciones.length / 3 }, (_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const otro = Math.floor(azar() * (i + 1))
    const temporal = indices[i]
    indices[i] = indices[otro]
    indices[otro] = temporal
  }
  const posiciones = new Float32Array(cantidad * 3)
  const colores = new Float32Array(cantidad * 3)
  for (let i = 0; i < cantidad; i++) {
    const desde = indices[i] * 3
    posiciones.set(base.posiciones.subarray(desde, desde + 3), i * 3)
    colores.set(base.colores.subarray(desde, desde + 3), i * 3)
  }
  return { posiciones, colores }
}
export const explosionDe = u => THREE.MathUtils.smoothstep(u, ...CARTA.pokebola)

const vertice = `
attribute float aIndice;
attribute vec4 aAzar;
attribute vec4 aCelda;
attribute vec3 aOrigen;
attribute vec3 aColor;
attribute vec3 aForma;
uniform float uTiempo, uExplosion, uCarta, uOndaTiempo, uRecorrido, uPixel, uReducido, uViaje, uForma, uAtlasListo, uCantidad;
uniform vec2 uVista, uPuntero;
uniform vec4 uRect;
uniform float uDia, uActivo;
varying vec4 vCelda;
varying float vGiro, vMezcla, vAlfa;
varying vec3 vColor;
varying vec2 vDireccion;
varying float vCarta;
float ruido(float t) {
  float i = floor(t), f = fract(t);
  f = f*f*(3.-2.*f);
  return mix(fract(sin(i*127.1)*43758.5453),fract(sin((i+1.)*127.1)*43758.5453),f)*2.-1.;
}
void main() {
  float e = aAzar.w < .24 ? uCarta : uExplosion;
  vec3 p = position;
  float capa = floor(aAzar.z * 4.0);
  p.xy *= uVista * .5;
  p.y += ruido(uTiempo * (.12 + aAzar.x * .13) + aAzar.y * 30.) * (7. + capa * 3.);
  p.x += ruido(uTiempo * .16 + aAzar.x * 30.) * (8. + capa * 4.);
  p.y = mod(p.y + uRecorrido * (14. + capa * 11.) + uVista.y * .6, uVista.y * 1.2) - uVista.y * .6;
  vec3 bola = aOrigen;
  vec3 normal = normalize(bola);
  float t = uTiempo;
  vec3 campo = vec3(ruido(normal.y*4.+t*.19), ruido(normal.z*4.-t*.16), ruido(normal.x*4.+t*.13));
  vec3 tangente = campo - normal * dot(campo, normal);
  float rasgo = smoothstep(.09,.25,abs(normal.y)) * smoothstep(.2,.4,length(normal.xy));
  bola = normalize(normal + tangente * .12 * rasgo) * length(bola);
  float desprende = pow(.5+.5*sin(t*.43+aAzar.y*6.28), 12.) * step(.88,aAzar.x) * (1.-smoothstep(.2,.65,abs(normal.z)));
  bola *= 1. + (.016*sin(t*.65) + desprende*.14) * (1.-uReducido);
  float giro = (uPuntero.x * .22 + sin(t*.095)*.26) * (1.-uReducido);
  bola.xz = mat2(cos(giro), -sin(giro), sin(giro), cos(giro)) * bola.xz;
  float inclinacion = uPuntero.y * .13 * (1.-uReducido);
  bola.yz = mat2(cos(inclinacion),-sin(inclinacion),sin(inclinacion),cos(inclinacion)) * bola.yz;
  vec3 origen = bola * min(uVista.x, uVista.y) * .49;
  // La esfera acompaña el encuadre de la carta, con perspectiva compensada.
  origen.xy *= (1500.-origen.z)/1500.;
  
  if (aAzar.w < .24) {
    origen = vec3(uRect.xy + (aAzar.xy-.5)*uRect.zw, 0.);

  }
  vCarta = step(aAzar.w, .24);
  vec2 centro = vec2(0.);
  vec2 cerca = bola.xy * min(uVista.x,uVista.y)/uVista + centro - uPuntero;
  float edad = uTiempo-uOndaTiempo-length(cerca)*1.8;
  float onda = sin(max(0.,edad)*5.) * exp(-max(0.,edad)*1.8) * step(0.,edad);
  origen.xy += normalize(cerca+.001)*onda*14.*(1.-vCarta)*(1.-uReducido);

  p.xy *= (1500.-p.z)/1500.;
  // Resorte amortiguado y onda viajera: sin actualizar buffers en CPU.
  vec2 d = p.xy - uPuntero*uVista*.5*(1500.-p.z)/1500.;
  float distancia = length(d);
  float edadCampo = uTiempo-uOndaTiempo-distancia/650.;
  float resorte = (1.-exp(-max(0.,uTiempo-uOndaTiempo)*5.)*cos(max(0.,uTiempo-uOndaTiempo)*9.));
  float empuje = exp(-distancia*distancia/22000.)*65.*uActivo*resorte;
  float eco = sin(max(0.,edadCampo)*10.)*exp(-max(0.,edadCampo)*3.)*step(0.,edadCampo)*22.;
  p.xy += normalize(d+.001)*(empuje+eco)*(1.-uReducido);
  vec3 destino = p;
  p = mix(origen, destino, uReducido > .5 ? step(.5, e) : e);
  if (uReducido < .5) p.xy += normalize(origen.xy + .01) * sin(e * 3.14159) * min(uVista.x, uVista.y) * .24;
  if (aForma.z > .5) p.xy = mix(p.xy, aForma.xy * uVista * .5 * (1500.-p.z)/1500., uForma);
  p.z += uViaje * (500. + aAzar.z * 600.);
  vDireccion = normalize(p.xy + .01);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
  float tamano = mix(8., 24., aAzar.z) * (uVista.x < 760. ? .65 : 1.);
  gl_PointSize = mix(10., tamano, smoothstep(.15, .7, e)) * uPixel * 1500. / (1500.-p.z);
  vCelda = aCelda;
  vGiro = aAzar.y * 6.28 + uTiempo * (aAzar.x - .5) * .12;
  vMezcla = uReducido > .5 ? step(.5, e) : smoothstep(.12, .65, e);
  float universo = e * mix(.12, .46, aAzar.z) * smoothstep(aAzar.w * .55, aAzar.w * .55 + .25, e + min(uRecorrido * .016, .45));
  vAlfa = mix(mix(.65, .9, vCarta), universo, smoothstep(0., .3, e));
  if (vCarta > .5) vAlfa *= smoothstep(.0,.07,e);
  vAlfa *= mix(1., uAtlasListo, smoothstep(.3, .7, e));
  if (aIndice >= uCantidad) vAlfa *= 1.-smoothstep(.25,.95,e);
  float pulso = pow(.5+.5*cos(abs(normal.y)*7.-t*.9),10.);
  float titileo = .72+.28*sin(t*(.45+aAzar.x*.9)+aAzar.y*40.);
  vColor = mix(aColor * (1.5 + titileo*.6 + pulso*.8), mix(vec3(.72,.75,.91), vec3(.92,.89,1.), aAzar.x), vMezcla);
  vColor = mix(vColor, mix(vec3(.20,.08,.34),vec3(.30,.14,.46),aAzar.x), uDia);
  if (uVista.x < 760.) {
    float lectura = smoothstep(-.7,-.4,p.y/(uVista.y*.5)) * (1.-smoothstep(-.2,.1,p.y/(uVista.y*.5)));
    vAlfa *= mix(1.,.45,lectura * e);
  }
  if (aForma.z > .5) vAlfa = mix(vAlfa, .72, uForma);
  if (uReducido > .5) vAlfa = e < .5 ? .65 * (1.-vCarta) * (1.-e*2.) : universo * (e*2.-1.) * uAtlasListo;
}`
const fragment = `
uniform sampler2D uAtlas;
uniform float uViaje;
varying vec4 vCelda;
varying float vGiro, vMezcla, vAlfa;
varying vec3 vColor;
varying vec2 vDireccion;
varying float vCarta;
float trianguloEquilatero(vec2 p) {
  const float k = 1.7320508;
  p.x = abs(p.x) - 1.;
  p.y += 1. / k;
  if (p.x + k*p.y > 0.) p = vec2(p.x-k*p.y,-k*p.x-p.y)/2.;
  p.x -= clamp(p.x,-2.,0.);
  return -length(p)*sign(p.y);
}
void main() {
  vec2 r = (gl_PointCoord - .5) * 2.;
  float longitudinal = dot(r, vDireccion);
  float transversal = abs(r.x * vDireccion.y - r.y * vDireccion.x);
  float estela = exp(-transversal * 65.) * smoothstep(-1., -.1, longitudinal) * (1. - smoothstep(-.1, .8, longitudinal)) * uViaje * .4;
  vec2 q = gl_PointCoord - .5;
  q = mat2(cos(vGiro),-sin(vGiro),sin(vGiro),cos(vGiro)) * q + .5;
  if (min(q.x,q.y) < 0. || max(q.x,q.y) > 1.) discard;
  float alfa = texture2D(uAtlas, vCelda.xy + vec2(q.x, 1.-q.y) * vCelda.zw).a;
  float d = trianguloEquilatero((q*2.-1.)*1.35);
  float aa = max(fwidth(d), .02);
  float triangulo = 1.-smoothstep(.13-aa,.13+aa,abs(d));
  float cuadrado = step(max(abs(q.x-.5),abs(q.y-.5)), .38);
  alfa = max(mix(mix(triangulo, cuadrado, vCarta), alfa, vMezcla), estela);
  if (alfa * vAlfa < .008) discard;
  gl_FragColor = vec4(vColor, alfa * vAlfa);
}`

// Comparto el atlas para dibujar Pokémon y objetos en una sola llamada.
async function cargarAtlas(generacion, signal) {
  const leer = async nombre => {
    const respuesta = await fetch(`img/universo/${nombre}.json`, { signal })
    if (!respuesta.ok || !respuesta.headers.get('content-type')?.includes('json')) throw Error('Atlas pendiente')
    const datos = await respuesta.json()
    if (!datos.columnas || !datos.numeros?.length && !datos.nombres?.length) throw Error('Atlas incompleto')
    const blob = await fetch(`img/universo/${nombre}.png`, { signal }).then(r => { if (!r.ok) throw Error('Imagen pendiente'); return r.blob() })
    const imagen = await createImageBitmap(blob)
    return { datos, imagen, cantidad: (datos.numeros || datos.nombres).length }
  }
  const pokemon = await leer(`gen${generacion}`)
  if (!pokemon) return null
  let objetos
  try { objetos = await leer('objetos') } catch { /* Los objetos son opcionales. */ }
  if (signal.aborted) { pokemon.imagen.close(); objetos?.imagen.close(); return null }
  const lienzo = document.createElement('canvas')
  lienzo.width = Math.max(pokemon.imagen.width, objetos?.imagen.width || 0)
  lienzo.height = pokemon.imagen.height + (objetos?.imagen.height || 0)
  const contexto = lienzo.getContext('2d')
  const celdas = []
  for (const [atlas, y] of [[pokemon, 0], [objetos, pokemon.imagen.height]]) {
    if (!atlas) continue
    contexto.drawImage(atlas.imagen, 0, y)
    const lista = []
    for (let i = 0; i < atlas.cantidad; i++) lista.push([(i % atlas.datos.columnas) * atlas.datos.celda / lienzo.width, 1 - (y + (Math.floor(i / atlas.datos.columnas) + 1) * atlas.datos.celda) / lienzo.height, atlas.datos.celda / lienzo.width, atlas.datos.celda / lienzo.height])
    celdas.push(lista)
    atlas.imagen.close()
  }
  const textura = new THREE.CanvasTexture(lienzo)
  textura.generateMipmaps = true
  return { textura, pokemon: celdas[0], objetos: celdas[1] || [] }
}

export function crearUniverso({ escena, generacion, reducido }) {
  const abortar = new AbortController()
  const total = window.innerWidth < 760 ? 1300 : 3500
  const posiciones = new Float32Array(total * 3)
  const origenes = new Float32Array(total * 3)
  const azar = new Float32Array(total * 4)
  const celdas = new Float32Array(total * 4)
  const formas = new Float32Array(total * 3)
  const rect = new THREE.Vector4()

  let semilla = 149
  const aleatorio = () => { semilla = (1664525 * semilla + 1013904223) >>> 0; return semilla / 4294967296 }
  const esfera = distribuirPokebola(total, aleatorio)
  const colores = esfera.colores
  for (let i = 0; i < total; i++) {
    posiciones.set([(aleatorio() * 2 - 1) * 1.15, (aleatorio() * 2 - 1) * 1.15, -(3-i%4)*260], i * 3)
    origenes.set(esfera.posiciones.subarray(i*3,i*3+3),i*3)
    azar.set([aleatorio(), aleatorio(), (i % 4 + aleatorio()) / 4, aleatorio()], i * 4)
  }
  const geometria = new THREE.BufferGeometry()
  geometria.setAttribute('position', new THREE.BufferAttribute(posiciones.slice(), 3).setUsage(THREE.DynamicDrawUsage))
  geometria.setAttribute('aIndice', new THREE.BufferAttribute(Float32Array.from({ length: total }, (_, i) => i), 1))
  geometria.setAttribute('aColor', new THREE.BufferAttribute(colores, 3))
  geometria.setAttribute('aOrigen', new THREE.BufferAttribute(origenes, 3))
  geometria.setAttribute('aAzar', new THREE.BufferAttribute(azar, 4))
  geometria.setAttribute('aCelda', new THREE.BufferAttribute(celdas, 4))
  geometria.setAttribute('aForma', new THREE.BufferAttribute(formas, 3).setUsage(THREE.DynamicDrawUsage))
  const vacia = new THREE.DataTexture(new Uint8Array([255,255,255,0]), 1, 1)
  vacia.needsUpdate = true
  const uniforms = { uRect: { value: rect }, uDia: { value: 0 }, uActivo: { value: 0 }, uCarta: { value: 0 }, uOndaTiempo: { value: -10 }, uCantidad: { value: 700 }, uPuntero: { value: new THREE.Vector2() }, uAtlasListo: { value: 0 }, uTiempo: { value: 0 }, uExplosion: { value: 0 }, uRecorrido: { value: 0 }, uPixel: { value: 1 }, uReducido: { value: reducido ? 1 : 0 }, uVista: { value: new THREE.Vector2(1,1) }, uAtlas: { value: vacia }, uViaje: { value: 0 }, uForma: { value: 0 } }
  const material = new THREE.ShaderMaterial({ vertexShader: vertice, fragmentShader: fragment, uniforms, transparent: true, depthWrite: false })
  const nube = new THREE.Points(geometria, material)
  nube.frustumCulled = false
  escena.add(nube)
  let atlas
  cargarAtlas(generacion, abortar.signal).then(datos => {
    if (!datos) return
    if (abortar.signal.aborted) return datos.textura.dispose()
    atlas = datos
    uniforms.uAtlas.value = atlas.textura
    uniforms.uAtlasListo.value = 1
    for (let i = 0; i < total; i++) {
      const lista = azar[i*4] < .08 && atlas.objetos.length ? atlas.objetos : atlas.pokemon
      celdas.set(lista[i % lista.length], i*4)
    }
    geometria.attributes.aCelda.needsUpdate = true
    document.getElementById("universo").dispatchEvent(new Event("universolisto"))
  }).catch(() => {})

  const lineasGeo = new THREE.BufferGeometry()
  const pares = []
  for (let i=0; i<total; i++) {
    for (let j=i+1; j<Math.min(total,i+80); j++) {
      if (Math.hypot(posiciones[i*3]-posiciones[j*3],posiciones[i*3+1]-posiciones[j*3+1]) < .14 && Math.abs(posiciones[i*3+2]-posiciones[j*3+2]) < 1) {
        pares.push(i,j); break
      }
    }
  }
  for (const [nombre, atributo] of Object.entries(geometria.attributes)) {
    const datos = new Float32Array(pares.length*atributo.itemSize)
    pares.forEach((indice,k) => datos.set(atributo.array.subarray(indice*atributo.itemSize,(indice+1)*atributo.itemSize),k*atributo.itemSize))
    lineasGeo.setAttribute(nombre,new THREE.BufferAttribute(datos,atributo.itemSize))
  }
  const tinta = new THREE.ShaderMaterial({
    uniforms, transparent:true, depthWrite:false,
    vertexShader: vertice,
    fragmentShader:`uniform vec2 uPuntero, uVista; uniform float uPixel, uExplosion, uActivo, uDia; void main(){ vec2 q=gl_FragCoord.xy/uPixel; vec2 p=(uPuntero*.5+.5)*uVista; float a=(1.-smoothstep(60.,180.,distance(q,p)))*.12*uExplosion*uActivo; gl_FragColor=vec4(mix(vec3(.8,.7,1.),vec3(.25,.1,.4),uDia),a); }`
  })
  const lineas = new THREE.LineSegments(lineasGeo,tinta)
  lineas.frustumCulled=false
  escena.add(lineas)
  const lejanas = new THREE.Group()
  escena.add(lejanas)
  fetch('img/universo/constelaciones.json', { signal: abortar.signal }).then(r => r.json()).then(datos => {
    if (abortar.signal.aborted) return
    for (const [i, dibujo] of (datos[generacion] || []).entries()) {
      const grupo = new THREE.Group()
      const puntos = dibujo.estrellas.map(([x,y]) => new THREE.Vector3(x-.5,.5-y,0))
      const g = new THREE.BufferGeometry().setFromPoints(puntos)
      grupo.add(new THREE.Points(g, new THREE.PointsMaterial({ color: '#d7dcff', size: 2.5, sizeAttenuation: false, transparent: true, opacity: .5, depthWrite: false })))
      const segmentos = dibujo.lineas.flatMap(([a,b]) => puntos[a] && puntos[b] ? [puntos[a],puntos[b]] : [])
      grupo.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(segmentos), new THREE.LineBasicMaterial({ color: '#aaa4ce', transparent: true, opacity: .14, depthWrite: false })))
      grupo.userData.indice = i
      lejanas.add(grupo)
    }
    actualizarTema()
    document.getElementById("universo").dispatchEvent(new Event("universolisto"))
  }).catch(() => {})
  const actualizarTema = () => {
    const dia = document.documentElement.dataset.theme === 'day'
    uniforms.uDia.value = dia ? 1 : 0

    lejanas.traverse(o => { if (o.material) o.material.color.set(dia ? '#543078' : '#c4b5e6') })
  }
  new MutationObserver(actualizarTema).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  actualizarTema()
  let ultimo = { x: 9, y: 9, tiempo: -1 }
  return {
    listo: () => !!atlas,
    reducir(valor) { reducido = valor; uniforms.uReducido.value = valor ? 1 : 0 },
    encuadrar(r, ancho, alto) {
      rect.set(r.left+r.width/2-ancho/2, alto/2-r.top-r.height/2, r.width, r.height)
    },
    actualizar({ tiempo, delta, u, recorrido, ancho, alto, puntero, pixel, cantidad, transicion }) {
      const e = explosionDe(u)
      uniforms.uExplosion.value = e
      uniforms.uCarta.value = progresoCarta(u)
      uniforms.uTiempo.value = reducido ? 0 : tiempo
      uniforms.uRecorrido.value = reducido ? 0 : recorrido
      uniforms.uVista.value.set(ancho, alto)
      uniforms.uPixel.value = pixel
      uniforms.uViaje.value = reducido ? 0 : transicion.viaje || 0
      uniforms.uForma.value = reducido ? 0 : transicion.fuerza || 0
      nube.visible = true
      geometria.setDrawRange(0, e < .95 ? total : cantidad)
      uniforms.uCantidad.value = cantidad
      uniforms.uPuntero.value.set(puntero.x, -puntero.y)
      if (!reducido && puntero.activo && tiempo - ultimo.tiempo > .14 && Math.hypot(puntero.x-ultimo.x,puntero.y-ultimo.y) > .035) {
        uniforms.uOndaTiempo.value = tiempo
        ultimo = { ...puntero, tiempo }
      }
      uniforms.uActivo.value = puntero.activo && !reducido ? 1 : 0
      lejanas.visible = true
      lejanas.children.forEach((grupo,i) => {
        grupo.scale.setScalar(Math.min(ancho,alto)*(.5+i%2*.18)*(3700/1500))
        grupo.position.set((i%2 ? 1 : -1)*ancho*.22*(3700/1500), Math.sin(recorrido*.035+i*2.4)*alto*.28*(3700/1500), -2200)
        const presencia = .35+.65*(.5+.5*Math.cos(recorrido*.13-i*2))
        grupo.children[0].material.opacity = presencia*(reducido ? .55 : .45+.15*Math.sin(tiempo*.7+i))
        grupo.children[1].material.opacity = presencia*.18
      })
    },
    liberar() {
      abortar.abort()
      geometria.dispose(); material.dispose(); vacia.dispose(); atlas?.textura.dispose()
      lineasGeo.dispose(); tinta.dispose()
      lejanas.traverse(o => { o.geometry?.dispose(); o.material?.dispose() })
      escena.remove(nube,lineas,lejanas)
    },
  }
}

// El DOM se mide en eventos, nunca en el bucle de animación.
const canvas = document.getElementById('universo');
const card = document.getElementById('card');
const hero = document.querySelector('.hero');
const preferencia = matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
} catch { canvas.hidden = true; }
if (renderer) {
  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(35, 1, .1, 6000);
  camara.position.z = 1500;
  const universo = crearUniverso({ escena, generacion: 1+Math.floor(Math.random()*9), reducido: preferencia.matches });
  let ancho, alto, progreso=0, recorrido=0, frame=0, previo=0, tiempo=0, visible=true, perdido=false;
  const puntero = { x:0, y:0, activo:false };
  const transicion = { viaje:0, fuerza:0 };
  function actualizarScroll() {
    const cr = card.getBoundingClientRect();
    const inicio = Math.max(0, card.offsetTop+card.offsetHeight-alto*.85);
    progreso = preferencia.matches ? 0 : THREE.MathUtils.clamp((scrollY-inicio)/Math.max(320,alto*.65),0,1);
    recorrido = scrollY/alto;
    universo.encuadrar(cr,ancho,alto);
    card.style.opacity = perdido || !universo.listo() || preferencia.matches ? '1' : String(1-THREE.MathUtils.smoothstep(progreso,.12,.25));
    if (preferencia.matches) dibujar(performance.now());
  }
  function ajustar() {
    ancho=innerWidth; alto=innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1,ancho<760?1:1.5));
    renderer.setSize(ancho,alto,false);
    camara.aspect=ancho/alto;
    camara.fov=THREE.MathUtils.radToDeg(2*Math.atan(alto/3000));
    camara.updateProjectionMatrix();
    actualizarScroll();
  }
  function dibujar(ahora) {
    if(document.hidden || !visible || perdido) return;
    const delta=Math.min((ahora-(previo||ahora))/1000,.04); previo=ahora;
    if(!preferencia.matches) tiempo+=delta;
    universo.actualizar({tiempo,delta,u:progreso,recorrido,ancho,alto,puntero,pixel:renderer.getPixelRatio(),cantidad:Math.round((ancho<760?350:950)*(1+Math.min(recorrido*.06,.3))),transicion});
    renderer.render(escena,camara);
  }
  function ciclo(ahora) {
    frame=0; dibujar(ahora);
    if(!document.hidden && visible && !perdido && !preferencia.matches) frame=requestAnimationFrame(ciclo);
  }
  function reanudar() {
    cancelAnimationFrame(frame); frame=0; previo=0;
    if(!document.hidden && visible && !perdido) frame=requestAnimationFrame(ciclo);
  }
  addEventListener('scroll',actualizarScroll,{passive:true});
  addEventListener('resize',ajustar);
  new ResizeObserver(ajustar).observe(hero);
  addEventListener('pointermove',e => {
    if(preferencia.matches || e.pointerType!=='mouse' && !e.buttons) return;
    puntero.x=e.clientX/ancho*2-1; puntero.y=e.clientY/alto*2-1; puntero.activo=true;
  },{passive:true});
  const salir=()=>{puntero.activo=false;};
  document.addEventListener('pointerleave',salir);
  addEventListener('blur',salir);
  addEventListener('pointerup',e=>{if(e.pointerType!=='mouse') salir();});
  document.addEventListener('visibilitychange',reanudar);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;reanudar();}).observe(canvas);
  new MutationObserver(()=>{if(preferencia.matches) dibujar(performance.now());}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  preferencia.addEventListener('change',()=>{universo.reducir(preferencia.matches);actualizarScroll();reanudar();});
  canvas.addEventListener('universolisto',()=>{actualizarScroll();reanudar();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();perdido=true;card.style.opacity='1';canvas.hidden=true;cancelAnimationFrame(frame);});
  canvas.addEventListener('webglcontextrestored',()=>{perdido=false;canvas.hidden=false;ajustar();reanudar();});
  addEventListener('pagehide',()=>cancelAnimationFrame(frame));
  addEventListener('pageshow',reanudar);
  ajustar(); reanudar();
}
