document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("returnForm");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const productName = document.getElementById("productName").value.trim();
    const category = document.getElementById("category").value;
    const weight = parseFloat(document.getElementById("weight").value);
    const productAge = document.getElementById("productAge").value;
    const productCondition = document.getElementById("productCondition").value.trim();
    const photo = document.getElementById("photo").files[0];

    if (!productName || !category || !weight || !productAge || !productCondition || !photo) {
      return alert("Please fill out all fields and upload an image.");
    }

    if (isNaN(weight) || weight < 0.1) {
      return alert("Weight must be at least 0.1 kg.");
    }

    const formData = new FormData();
    formData.append("productName", productName);
    formData.append("category", category);
    formData.append("weight", weight);
    formData.append("productAge", productAge);
    formData.append("productCondition", productCondition);
    formData.append("photo", photo);

    try {
      const response = await fetch("http://localhost:8080/item/return", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      console.log("Response:", result);

      if (result.success) {
        alert("Return item submitted successfully ");
        form.reset();
      } else {
        alert(result.error || "Failed to submit the form.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("An error occurred while submitting the form.");
    }
  });
});

