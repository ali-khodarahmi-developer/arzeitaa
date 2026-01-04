let webApp = window.Eitaa?.WebApp;

document.addEventListener("DOMContentLoaded", function () {
  if (webApp) {
    webApp.ready();
    webApp.expand();
    webApp.disableVerticalSwipes();
    console.log("Eitaa WebApp initialized");
  }

  initializeApp();
});

let currentTab = "gold";
let updateInterval = null;
const UPDATE_FREQUENCY = 30000;

function toPersianNumber(num) {
  return num.toString().replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
}

function formatPrice(price) {
  return toPersianNumber(price.toLocaleString("en-US"));
}

async function fetchPrices() {
  const loadingEl = document.getElementById("loading");
  try {
    if (!document.querySelector(".price-card")) {
      loadingEl.style.display = "flex";
    }

    const response = await fetch("/api/prices");
    const data = await response.json();

    updateUI(data);
    updateLastTime(data.last_update);

    loadingEl.style.display = "none";
  } catch (error) {
    console.error("خطا در دریافت قیمت‌ها:", error);
    loadingEl.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color: #ef4444; font-size: 2rem;"></i>
            <p>خطا در بارگذاری داده‌ها</p>
            <button onclick="fetchPrices()" class="action-btn">
                <i class="fas fa-redo"></i>
                <span>تلاش مجدد</span>
            </button>
        `;
    loadingEl.style.display = "flex";
  }
}

function updateUI(data) {
  updatePriceGrid("goldGrid", data.gold, {
    "24k": { name: "طلا ۲۴ عیار", icon: "fa-ring" },
    "18k_750": { name: "طلا ۱۸ عیار ۷۵۰", icon: "fa-ring" },
    "18k_740": { name: "طلا ۱۸ عیار ۷۴۰", icon: "fa-ring" },
    used_gold: { name: "طلای دست دوم", icon: "fa-recycle" },
  });

  updatePriceGrid("coinsGrid", data.coins, {
    bahar_azadi: { name: "سکه بهار آزادی", icon: "fa-coins" },
    emami: { name: "سکه امامی", icon: "fa-coins" },
    nim: { name: "نیم سکه", icon: "fa-coins" },
    rob: { name: "ربع سکه", icon: "fa-coins" },
    grami: { name: "سکه گرمی", icon: "fa-coins" },
  });

  updatePriceGrid("currencyGrid", data.currency, {
    dollar: { name: "دلار آمریکا", icon: "fa-dollar-sign" },
    gbp: { name: "پوند انگلیس", icon: "fa-sterling-sign" },
  });
}

function updatePriceGrid(gridId, items, config) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = "";

  Object.entries(items).forEach(([key, price]) => {
    const card = createPriceCard(config[key].name, price, config[key].icon);
    grid.appendChild(card);
  });
}

function createPriceCard(title, price, icon) {
  const card = document.createElement("div");
  card.className = "price-card";
  card.innerHTML = `
        <div class="card-header">
            <div class="card-title">${title}</div>
            <i class="fas ${icon} card-icon"></i>
        </div>
        <div class="price-value">${formatPrice(price)} تومان</div>
    `;

  card.style.opacity = "0";
  card.style.transform = "translateY(20px)";
  setTimeout(() => {
    card.style.transition = "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
    card.style.opacity = "1";
    card.style.transform = "translateY(0)";
  }, Math.random() * 200);

  return card;
}

function updateLastTime(time) {
  const lastUpdateEl = document.getElementById("lastUpdate");
  lastUpdateEl.innerHTML = `
        <i class="fas fa-sync-alt"></i>
        <span>آخرین بروزرسانی: ${time}</span>
    `;
}

function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.tab;

      document.querySelector(".tab-btn.active").classList.remove("active");
      document.querySelector(".tab-content.active").classList.remove("active");

      btn.classList.add("active");
      document.getElementById(tabName).classList.add("active");

      currentTab = tabName;

      if (webApp && webApp.HapticFeedback) {
        webApp.HapticFeedback.selectionChanged();
      }
    });
  });
}

function joinChannel() {
  if (webApp) {
    webApp.openEitaaLink("https://eitaa.com/Expert_Developers");
  } else {
    window.open("https://eitaa.com/Expert_Developers", "_blank");
  }
}

function openChannel() {
  if (webApp) {
    webApp.openEitaaLink("https://eitaa.com/Ali_Khodarahmi_Dev");
  } else {
    window.open("https://eitaa.com/Ali_Khodarahmi_Dev", "_blank");
  }
}

function openSupport() {
  if (webApp) {
    webApp.openEitaaLink("https://eitaa.com/Ali_Khodarahmi_Developer");
  } else {
    window.open("https://eitaa.com/Ali_Khodarahmi_Developer", "_blank");
  }
}

function openLink(url) {
  if (webApp && webApp.openLink) {
    webApp.openLink(url);
  } else {
    window.open(url, "_blank");
  }
}

function setupLinks() {
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="http"]');
    if (link) {
      e.preventDefault();
      openLink(link.href);
    }
  });
}

function startAutoUpdate() {
  fetchPrices();
  updateInterval = setInterval(fetchPrices, UPDATE_FREQUENCY);
}

function stopAutoUpdate() {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
}

function handleAppVisibility() {
  if (webApp) {
    webApp.onEvent("activated", () => {
      console.log("App activated");
      startAutoUpdate();
    });

    webApp.onEvent("deactivated", () => {
      console.log("App deactivated");
      stopAutoUpdate();
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoUpdate();
    } else {
      startAutoUpdate();
    }
  });
}

function initializeApp() {
  setupTabs();
  setupLinks();
  handleAppVisibility();
  startAutoUpdate();

  if (webApp) {
    document.body.classList.add("eitaa-web-app");

    document.documentElement.style.setProperty(
      "--tg-theme-accent-bg-color",
      "#FF6B35"
    );
  }
}

window.addEventListener("beforeunload", () => {
  stopAutoUpdate();
});
