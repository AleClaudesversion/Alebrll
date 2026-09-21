(function () {
  const STORAGE_KEY = 'jqm_carrito';
  let recargoPct = 6;

  function leerCarrito() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function guardarCarrito(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    render();
  }

  function agregar(producto) {
    const items = leerCarrito();
    const existente = items.find((i) => i.id === producto.id);
    if (existente) {
      existente.cantidad += 1;
    } else {
      items.push({ ...producto, cantidad: 1 });
    }
    guardarCarrito(items);
    abrirCarrito();
  }

  function cambiarCantidad(id, delta) {
    let items = leerCarrito();
    items = items
      .map((i) => (i.id === id ? { ...i, cantidad: i.cantidad + delta } : i))
      .filter((i) => i.cantidad > 0);
    guardarCarrito(items);
  }

  function precioConRecargo(precioLista) {
    return Math.round(precioLista / (1 - recargoPct / 100) / 100) * 100;
  }

  function render() {
    const items = leerCarrito();
    const cartItemsEl = document.getElementById('cartItems');
    const cartCountEl = document.getElementById('cartCount');
    const totalListaEl = document.getElementById('cartTotalLista');
    const totalMpEl = document.getElementById('cartTotalMp');

    cartCountEl.textContent = items.reduce((acc, i) => acc + i.cantidad, 0);

    if (items.length === 0) {
      cartItemsEl.innerHTML = '<p class="cart-empty">Todavía no agregaste nada.</p>';
    } else {
      cartItemsEl.innerHTML = items
        .map(
          (i) => `
        <div class="cart-item">
          ${i.imagen ? `<img src="${i.imagen}" alt="${i.nombre}">` : ''}
          <div class="info">
            <div>${i.nombre}</div>
            <div class="qty">
              <button data-action="menos" data-id="${i.id}">-</button>
              <span>${i.cantidad}</span>
              <button data-action="mas" data-id="${i.id}">+</button>
            </div>
          </div>
          <div>$${(i.precio * i.cantidad).toLocaleString('es-AR')}</div>
        </div>`
        )
        .join('');
    }

    const totalLista = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
    totalListaEl.textContent = `$${totalLista.toLocaleString('es-AR')}`;
    totalMpEl.textContent = `$${precioConRecargo(totalLista).toLocaleString('es-AR')}`;

    document.getElementById('payMp').disabled = items.length === 0;
    document.getElementById('payTransferencia').disabled = items.length === 0;
  }

  function abrirCarrito() {
    document.getElementById('cartDrawer').classList.add('open');
    document.getElementById('cartOverlay').classList.add('open');
  }
  function cerrarCarrito() {
    document.getElementById('cartDrawer').classList.remove('open');
    document.getElementById('cartOverlay').classList.remove('open');
  }

  async function pagarConMercadoPago() {
    const items = leerCarrito();
    if (items.length === 0) return;
    const btn = document.getElementById('payMp');
    btn.disabled = true;
    btn.textContent = 'Redirigiendo...';
    try {
      const resp = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ productoId: i.id, cantidad: i.cantidad })),
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Error al iniciar el pago');
      window.location.href = data.initPoint;
    } catch (err) {
      alert(err.message || 'No se pudo iniciar el pago. Probá de nuevo.');
      btn.disabled = false;
      btn.textContent = 'Pagar con Mercado Pago';
    }
  }

  async function pedirPorTransferencia() {
    const items = leerCarrito();
    if (items.length === 0) return;
    try {
      const resp = await fetch('/api/checkout/transferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ productoId: i.id, cantidad: i.cantidad })),
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Error al registrar el pedido');

      const resumen = items.map((i) => `${i.cantidad}x ${i.nombre}`).join(', ');
      const msg = `Hola! Quiero coordinar por transferencia el pedido #${data.pedidoId}: ${resumen}`;
      window.open(`https://wa.me/${window.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
      localStorage.removeItem(STORAGE_KEY);
      render();
    } catch (err) {
      alert(err.message || 'No se pudo registrar el pedido. Probá de nuevo.');
    }
  }

  document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.add-btn');
    if (addBtn) {
      agregar({
        id: Number(addBtn.dataset.id),
        nombre: addBtn.dataset.nombre,
        precio: Number(addBtn.dataset.precio),
        imagen: addBtn.dataset.imagen,
      });
      return;
    }
    const qtyBtn = e.target.closest('[data-action]');
    if (qtyBtn) {
      const id = Number(qtyBtn.dataset.id);
      cambiarCantidad(id, qtyBtn.dataset.action === 'mas' ? 1 : -1);
      return;
    }
    if (e.target.closest('#openCart')) return abrirCarrito();
    if (e.target.closest('#closeCart') || e.target.id === 'cartOverlay') return cerrarCarrito();
    if (e.target.id === 'payMp') return pagarConMercadoPago();
    if (e.target.id === 'payTransferencia') return pedirPorTransferencia();

    const filtro = e.target.closest('#catFilters button');
    if (filtro) {
      document.querySelectorAll('#catFilters button').forEach((b) => b.classList.remove('active'));
      filtro.classList.add('active');
      const cat = filtro.dataset.cat;
      document.querySelectorAll('#productGrid .product-card').forEach((card) => {
        card.style.display = cat === 'todas' || card.dataset.cat === cat ? '' : 'none';
      });
    }
  });

  fetch('/api/config')
    .then((r) => r.json())
    .then((cfg) => {
      recargoPct = cfg.recargoMpPct;
      render();
    })
    .catch(() => render());

  render();
})();
