const adminId = localStorage.getItem("admin_id");
const cardsContainer = document.getElementById("cards-container");

function returnedItemsDetails() {
  window.location.href = "item.html";
}

async function loadProducts() {
  try {
    const response = await fetch(`http://localhost:8080/products?admin_id=${adminId}`);
    const products = await response.json();

    for (const product of products) {
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.id = product.id; // keep product id on the DOM node

      const img = document.createElement("img");
      img.src = `http://localhost:8080/photo/${product.id}`;
      card.appendChild(img);

      const name = document.createElement("h3");
      name.textContent = product.name;
      card.appendChild(name);

      const category = document.createElement("p");
      category.className = "category";
      category.textContent = `Category: ${product.category}`;
      card.appendChild(category);

      const recommendation = document.createElement("p");
      recommendation.className = `recommend ${product.recommendation.toLowerCase()}`;
      recommendation.textContent = product.recommendation;
      card.appendChild(recommendation);

      const removeBtn = document.createElement("button");
      removeBtn.innerText = "Remove Item";
      removeBtn.className = "remove-btn";
      removeBtn.onclick = async () => {
        if (!confirm("Delete this item permanently?")) return;

        const id = card.dataset.id;
        const res = await fetch(`http://localhost:8080/product/${id}`, { method: "DELETE" });

        if (res.ok) {
          card.remove();
          console.log("item removed");
        } else {
          alert("Failed to delete item");
        }
      };

      card.appendChild(removeBtn);
      card.addEventListener("click", (e) => {
        if (e.target === removeBtn) return;
        const recommendation = (product.recommendation || "").toLowerCase();
        let target = "repair.html";
        if (recommendation === "recycle") target = "recycle.html";
        if (recommendation === "reuse") target = "reuse.html";
        const params = new URLSearchParams({
          id: String(product.id),
          name: product.name,
          category: product.category,
          rec: product.recommendation,
        });
        window.location.href = `${target}?${params.toString()}`;
      });
      cardsContainer.appendChild(card);
    }
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

async function loadCoins() {
  try {
    const res = await fetch(`http://localhost:8080/admin-coins?admin_id=${adminId}`);
    const data = await res.json();
    const coins = data.coins ?? 0;

    const coinElem = document.getElementById("coin-balance");
    if (coinElem) coinElem.textContent = `Coins: ${coins}`;
  } catch (err) {
    console.error("Failed to load coins:", err);
  }
}

async function loadCO2() {
  try {
    const res = await fetch(`http://localhost:8080/admin-co2?admin_id=${adminId}`);
    const data = await res.json();
    document.getElementById("co2-saved").textContent = `CO₂ Saved: ${data.total_co2.toFixed(2)} kg`;
  } catch (err) {
    console.error("Error loading CO₂:", err);
  }
}

const logoutButton = document.querySelector("#logout") || document.querySelector("#logoutNav");
if (logoutButton) {
  logoutButton.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("admin_id");
    window.location.href = "admin.html";
  });
}

window.onload = () => {
  loadProducts();
  loadCoins();
  loadCO2();
};

// Modal logic removed; navigation handled per-card
