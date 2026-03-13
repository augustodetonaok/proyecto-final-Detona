async function cargarProductosIniciales() {
    try {
        const response = await fetch("data/productos.json");
        const data = await response.json();

        if (!localStorage.getItem("productos")) {
            productos = data;
            guardarProductos();
            mostrarProductos();
        }

    } catch (error) {
        console.error("Error cargando productos:", error);
    }
}

let productos = [];
let totalVendido = 0;
let carrito = [];
let vistaActual = localStorage.getItem("vista") || "user";


const formProducto = document.getElementById("formProducto");
const listaProductos = document.getElementById("listaProductos");
const carritoGuardado = localStorage.getItem("carrito");

if (carritoGuardado) {
    carrito = JSON.parse(carritoGuardado);
}

// CARGA DESDE STORAGE

const productosGuardados = localStorage.getItem("productos");

if (productosGuardados) {
    productos = JSON.parse(productosGuardados);

    productos.forEach(p => {
        if (p.precio === undefined || isNaN(p.precio)) {
            p.precio = 0;
        }
    });

    ordenarProductos();
    guardarProductos();
    mostrarProductos();
} else {
    cargarProductosIniciales();
}



const ventasGuardadas = localStorage.getItem("ventas");

if (ventasGuardadas) {
    totalVendido = parseFloat(ventasGuardadas);
}

// UTILIDADES


function crearProducto(nombre, cantidad, precio) {
    return { nombre, cantidad, precio };
}

function ordenarProductos() {
    productos.sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
    );
}

function guardarProductos() {
    localStorage.setItem("productos", JSON.stringify(productos));
}

function mostrarTotalVendido() {
    document.getElementById("totalVendido").textContent =
        "Total vendido: $" + totalVendido.toLocaleString();
}

function calcularValorTotal() {
    let total = productos.reduce((acc, p) => acc + p.cantidad * p.precio, 0);

    document.getElementById("valorTotal").textContent =
        "Valor total del inventario: $" + total.toLocaleString();
}

function cambiarVista(tipo) {

    vistaActual = tipo;

    localStorage.setItem("vista", tipo);

    const botonesAdmin = document.querySelectorAll(".admin");

    botonesAdmin.forEach(btn => {
        btn.style.display = tipo === "admin" ? "inline-block" : "none";
    });

}



// AGREGAR PRODUCTO


formProducto.addEventListener("submit", e => {
    e.preventDefault();

    const nombre = nombreProducto.value.trim();
    const cantidad = parseInt(cantidadProducto.value);
    const precio = parseFloat(precioProducto.value);

    agregarProducto(nombre, cantidad, precio);
    formProducto.reset();
});

function agregarProducto(nombre, cantidad, precio) {
    let existente = productos.find(p => p.nombre === nombre);

    if (existente) {
        existente.cantidad += cantidad;
        existente.precio = precio;
    } else {
        productos.push(crearProducto(nombre, cantidad, precio));
    }

    ordenarProductos();
    guardarProductos();
    mostrarProductos();

    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Producto guardado',
        showConfirmButton: false,
        timer: 1200
    });
}

// MOSTRAR INVENTARIO


function mostrarProductos() {
    listaProductos.innerHTML = "";

    productos.forEach((producto, i) => {
        const div = document.createElement("div");
        div.classList.add("producto-item");

        div.innerHTML = `
            <p>
                <strong>${producto.nombre}</strong><br>
                Stock: ${producto.cantidad}<br>
                Precio: $${producto.precio}
            </p>
            <div class="botones">
               <button class="admin" onclick="sumarStock(${i})">➕</button>
                <button class="admin" onclick="restarStock(${i})">➖</button>
                <button onclick="agregarAlCarrito(${i})">🛒</button>
                <button class="admin" onclick="eliminarProducto(${i})">🗑</button>
            </div>
        `;
        listaProductos.appendChild(div);
    });

    calcularValorTotal();
    mostrarTotalVendido();
}

// STOCK

function sumarStock(i) {
    productos[i].cantidad++;
    guardarProductos();
    mostrarProductos();
}

function restarStock(i) {
    if (productos[i].cantidad > 0) {
        productos[i].cantidad--;
        guardarProductos();
        mostrarProductos();
    }
}

function eliminarProducto(i) {
    productos.splice(i, 1);
    guardarProductos();
    mostrarProductos();
}


// CARRITO

function agregarAlCarrito(i) {
    const producto = productos[i];

    if (producto.cantidad === 0) {
        Swal.fire("Sin stock", "", "error");
        return;
    }

    let item = carrito.find(p => p.nombre === producto.nombre);
    let cantidadEnCarrito = item ? item.cantidad : 0;

    if (cantidadEnCarrito >= producto.cantidad) {
        Swal.fire("Stock insuficiente", "", "warning");
        return;
    }

    if (item) {
        item.cantidad++;
    } else {
        carrito.push({
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1
        });
    }

    mostrarCarrito();
    guardarCarrito();
}

function mostrarCarrito() {
    const lista = document.getElementById("carritoLista");
    lista.innerHTML = "";

    let subtotal = 0;

    carrito.forEach((item, i) => {
        subtotal += item.precio * item.cantidad;

        const div = document.createElement("div");

        div.innerHTML = `
            <strong>${item.nombre}</strong><br>
            Cantidad:
            <button onclick="disminuirCantidad(${i})">➖</button>
            ${item.cantidad}
            <button onclick="aumentarCantidad(${i})">➕</button><br>
            Total: $${item.precio * item.cantidad}<br>
            <button onclick="quitarDelCarrito(${i})">❌ Quitar</button>
            <hr>
        `;
        lista.appendChild(div);
    });

    subtotalCarrito.textContent =
        "Subtotal: $" + subtotal.toLocaleString();
}

function aumentarCantidad(i) {
    const item = carrito[i];
    const producto = productos.find(p => p.nombre === item.nombre);

    if (item.cantidad >= producto.cantidad) {
        Swal.fire("Stock máximo alcanzado");
        return;
    }

    item.cantidad++;
    mostrarCarrito();
    guardarCarrito();
}

function disminuirCantidad(i) {
    if (carrito[i].cantidad > 1) {
        carrito[i].cantidad--;
    } else {
        carrito.splice(i, 1);
    }
    mostrarCarrito();
    guardarCarrito();
}

function quitarDelCarrito(i) {
    carrito.splice(i, 1);
    mostrarCarrito();
    guardarCarrito();
}

function guardarCarrito() {
    localStorage.setItem("carrito", JSON.stringify(carrito));
}

// COBRAR

document.getElementById("btnCobrar").addEventListener("click", cobrar);

function cobrar() {
    if (carrito.length === 0) {
        Swal.fire("El carrito está vacío");
        return;
    }

    const subtotal = carrito.reduce((acc, item) =>
        acc + item.precio * item.cantidad, 0
    );

    Swal.fire({
        title: "Confirmar venta",
        html: `Total: <b>$${subtotal}</b>`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Cobrar"
    }).then(result => {
        if (!result.isConfirmed) return;

        let total = 0;

        carrito.forEach(item => {
            const producto = productos.find(p => p.nombre === item.nombre);

            if (producto.cantidad < item.cantidad) return;

            producto.cantidad -= item.cantidad;
            total += item.precio * item.cantidad;
        });

        totalVendido += total;

        localStorage.setItem("ventas", totalVendido);
        guardarProductos();

        carrito = [];
        guardarCarrito();

        mostrarCarrito();
        mostrarProductos();

        Swal.fire({
            icon: "success",
            title: "Venta realizada",
            text: `Se cobraron $${total}`,
            timer: 1500,
            showConfirmButton: false
        });
    });
}

mostrarProductos();
mostrarCarrito();
cambiarVista(vistaActual);