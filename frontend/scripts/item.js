const video = document.getElementById("video");
const photoList = document.getElementById("photoList");
const capturedPhotos = [];

const adminId = localStorage.getItem("admin_id");

navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((err) => {
    console.error("Camera error:", err);
  });

document.getElementById("click").addEventListener("click", () => {
  const canvas = document.createElement("canvas");
  canvas.width = 300;
  canvas.height = 200;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = canvas.toDataURL("image/png");
  capturedPhotos.push(imageData);

  const img = document.createElement("img");
  img.src = imageData;
  img.width = 100;
  photoList.appendChild(img);
});

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
    alert("Please capture at least one image.");
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
  if (recommendation == "Recycle") {
      let h3=document.querySelector("#coins");
  }
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
    window.location.href = "dashboard.html";
  } catch (err) {
    console.error("Submit error:", err);
    alert("Something went wrong while submitting data.");
  }
});
