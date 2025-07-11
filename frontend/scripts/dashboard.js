const adminId = localStorage.getItem("admin_id");
const cardsContainer = document.getElementById("cards-container");

function returnedItemsDetails() {
  window.location.href = "item.html";
}

async function loadProducts() {
  try {
    const response = await fetch(`http://localhost:8080/products?admin_id=${adminId}`);
    const products = await response.json();
    console.log("products : ", products);

    for (const product of products) {
      const card = document.createElement("div");
      card.className = "card";
      console.log("product : ", product.id);

      const img = document.createElement("img");
      img.src = `http://localhost:8080/photo/${product.id}`; 
      card.appendChild(img);

      const name = document.createElement("h3");
      name.textContent = product.name;
      card.appendChild(name);

      const category = document.createElement("p");
      category.textContent = `Category: ${product.category}`;
      card.appendChild(category);

      const recommendation = document.createElement("p");
      recommendation.textContent = `Recommendation: ${product.recommendation}`;
      card.appendChild(recommendation);

      cardsContainer.appendChild(card);
    }
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

window.onload = loadProducts;
