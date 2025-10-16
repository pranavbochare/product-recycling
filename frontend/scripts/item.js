const photoList = document.getElementById("photoList");
const capturedPhotos = [];

const adminId = localStorage.getItem("admin_id");

const logoutButton = document.querySelector("#logout") || document.querySelector("#logoutNav");
if (logoutButton) {
  logoutButton.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("admin_id");
    window.location.href = "admin.html";
  });
}

const fileInput = document.getElementById("photos");
if (fileInput) {
  fileInput.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    photoList.innerHTML = "";
    for (const file of files) {
      const dataUrl = await toDataURL(file);
      capturedPhotos.push(dataUrl);
      const img = document.createElement("img");
      img.src = dataUrl;
      img.width = 100;
      photoList.appendChild(img);
    }
  });
}

function toDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

document.getElementById("submit").addEventListener("click", async () => {
  const name = document.getElementById("productName").value;
  const category = document.getElementById("category").value;
  const weight = document.getElementById("weight").value;
  const age_days = document.getElementById("productAge").value;
  const condition_text = document.getElementById("productCondition").value;

  if (!name || !category || !weight || !age_days || !condition_text) {
    alert("Fill all product details");
    return;
  }

  if (capturedPhotos.length === 0) {
    alert("Please upload at least one image.");
    return;
  }

  const aiRes = await fetch("http://localhost:8080/predict-condition", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      category,
      weight,
      age_days,
      condition_text,
      photos: capturedPhotos.slice(0, 3),
    }),
  });

  const { recommendation, confidence } = await aiRes.json();
  console.log("Gemini says:", recommendation, confidence);

  try {
    const resProduct = await fetch("http://localhost:8080/add-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        admin_id: adminId,
        name,
        category,
        weight,
        age_days,
        condition_text,
        recommendation,
      }),
    });
    const productResponse = await resProduct.json();
    const productId = productResponse.productId;

    console.log("product id : ", productId);
    console.log("product : ", productResponse);

    if (!productId) throw new Error("Product insert failed");

    const resImages = await fetch("http://localhost:8080/upload-photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        admin_id: adminId,
        product_id: productId,
        photos: capturedPhotos,
      }),
    });
    const imageUploadResponse = await resImages.text();
    console.log("image response :", imageUploadResponse);

    alert("Product and images saved!");
    // if (recommendation == "Recycle") {
    //   window.location.href = "recycle.html";
    // } else if (recommendation == "Reuse") {
    //   window.location.href = "reuse.html";
    // } else if (recommendation == "Repair") {
    //   window.location.href = "repair.html";
    // }
    window.location.href = "dashboard.html";
  } catch (err) {
    console.error("Submit error:", err);
    alert("Something went wrong while submitting data.");
  }
});
