// Demo Shop: a tiny static app used as the system under test.
// State lives in sessionStorage so each browser context starts clean.
(function () {
  const USERS = {
    'qa.user@example.com': { password: 'Passw0rd!', locked: false },
    'locked.user@example.com': { password: 'Passw0rd!', locked: true },
  };

  const PRODUCTS = [
    { id: 'backpack', name: 'Trail Backpack', price: 49.99 },
    { id: 'jacket', name: 'Rain Jacket', price: 89.5 },
    { id: 'bottle', name: 'Water Bottle', price: 15.0 },
  ];

  const money = (n) => '$' + n.toFixed(2);
  const getUser = () => sessionStorage.getItem('user');
  const getCart = () => JSON.parse(sessionStorage.getItem('cart') || '[]');
  const setCart = (ids) => sessionStorage.setItem('cart', JSON.stringify(ids));

  function requireLogin() {
    if (!getUser()) {
      window.location.replace('index.html?reason=auth');
      return false;
    }
    return true;
  }

  function wireLogout() {
    document.getElementById('logout').addEventListener('click', () => {
      sessionStorage.clear();
      window.location.assign('index.html?reason=logout');
    });
  }

  function initLogin() {
    const params = new URLSearchParams(window.location.search);
    const notice = document.getElementById('notice');
    const messages = {
      auth: 'Please log in to continue.',
      logout: 'You have been logged out.',
    };
    if (messages[params.get('reason')]) {
      notice.textContent = messages[params.get('reason')];
      notice.hidden = false;
    }

    const form = document.getElementById('login-form');
    const error = document.getElementById('error');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = form.email.value.trim().toLowerCase();
      const password = form.password.value;
      let message = '';
      if (!email) message = 'Email is required.';
      else if (!password) message = 'Password is required.';
      else if (!USERS[email] || USERS[email].password !== password) message = 'Email or password is incorrect.';
      else if (USERS[email].locked) message = 'This account is locked. Contact support.';

      if (message) {
        error.textContent = message;
        error.hidden = false;
        return;
      }
      sessionStorage.setItem('user', email);
      window.location.assign('catalog.html');
    });
  }

  function renderBadge() {
    const badge = document.querySelector('[data-testid="cart-count"]');
    const count = getCart().length;
    badge.textContent = String(count);
    badge.hidden = count === 0;
  }

  function initCatalog() {
    if (!requireLogin()) return;
    wireLogout();
    const list = document.getElementById('products');
    const render = () => {
      const cart = getCart();
      list.innerHTML = '';
      for (const p of PRODUCTS) {
        const inCart = cart.includes(p.id);
        const li = document.createElement('li');
        li.innerHTML = `<span><strong>${p.name}</strong> ${money(p.price)}</span>`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = inCart ? 'Remove' : 'Add to cart';
        btn.setAttribute('aria-label', `${inCart ? 'Remove' : 'Add'} ${p.name} ${inCart ? 'from' : 'to'} cart`);
        btn.addEventListener('click', () => {
          const current = getCart();
          setCart(inCart ? current.filter((id) => id !== p.id) : [...current, p.id]);
          render();
        });
        li.appendChild(btn);
        list.appendChild(li);
      }
      renderBadge();
    };
    render();
  }

  function initCart() {
    if (!requireLogin()) return;
    wireLogout();
    const list = document.getElementById('cart-items');
    const empty = document.getElementById('empty');
    const total = document.getElementById('total');
    const checkout = document.getElementById('checkout');
    const render = () => {
      const items = PRODUCTS.filter((p) => getCart().includes(p.id));
      list.innerHTML = '';
      for (const p of items) {
        const li = document.createElement('li');
        li.innerHTML = `<span>${p.name}</span><span>${money(p.price)}</span>`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = 'Remove';
        btn.setAttribute('aria-label', `Remove ${p.name} from cart`);
        btn.addEventListener('click', () => {
          setCart(getCart().filter((id) => id !== p.id));
          render();
        });
        li.appendChild(btn);
        list.appendChild(li);
      }
      empty.hidden = items.length > 0;
      total.textContent = items.length ? 'Total: ' + money(items.reduce((s, p) => s + p.price, 0)) : '';
      checkout.disabled = items.length === 0;
    };
    render();
  }

  window.DemoShop = { initLogin, initCatalog, initCart };
})();
