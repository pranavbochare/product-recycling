function returnedItemsDetails() {
  window.location.href = "item.html";
  document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("returnForm");

    const productName = document.getElementById("productName").value.trim();
    const category = document.getElementById("category").value.trim();
    const weight = parseFloat(document.getElementById("weight").value);
    const productAge = document.getElementById("productAge").value;
    const condition = document.getElementById("productCondition").value.trim();
    const photo = document.getElementById("photo").files[0];

    if (!productName || !category || !productAge || !condition || !photo) {
      alert("Please fill in all the fields and upload a photo.");
      return;
    }

    if (isNaN(weight) || weight < 0.1) {
      alert("Please enter a valid weight (minimum 0.1 kg).");
      return;
    }
}
