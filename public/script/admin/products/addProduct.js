console.log("testing page add product");

//calculating selling price by calculating regular price and offer and brand offer and category offer
// take the biggest offer and and calculate the offer with it

//regularPrice
document.getElementById("regularPrice").addEventListener("input", calAndUpdate);
//offer
document.getElementById("offer").addEventListener("input", calAndUpdate);
//category
document.getElementById("category").addEventListener("change", calAndUpdate);
//Brand
document.getElementById("Brand").addEventListener("change", calAndUpdate);
// sellingPrice
document.getElementById("sellingPrice").addEventListener("click", calAndUpdate);

function calAndUpdate() {
  const priceVals = getAllValues();
  // calling calculate function
  const sellingPrice = calculateSellingPrice(
    priceVals.regularPrice,
    priceVals.offer,
    priceVals.categoryOfferValue,
    priceVals.brandOfferValue
  );
  // Update sellingPrice
  if (sellingPrice) {
    document.getElementById("sellingPrice").value = sellingPrice;
  }
  return true;
}

// for getting all the values for calculating selling price.
function getAllValues() {
  const regularPrice =
    parseFloat(document.getElementById("regularPrice").value) || 0;
  const offer = parseFloat(document.getElementById("offer").value) || 0;
  const categoryOfferValue =
    parseFloat(
      document
        .getElementById("category")
        ?.options[
          document.getElementById("category")?.selectedIndex
        ].getAttribute("offer")
    ) || 0;
  const brandOfferValue =
    parseFloat(
      document
        .getElementById("Brand")
        ?.options[document.getElementById("Brand")?.selectedIndex].getAttribute(
          "offer"
        )
    ) || 0;
  return (priceVals = {
    regularPrice,
    offer,
    categoryOfferValue,
    brandOfferValue,
  });
}
// function or calculating selling price and select only largest offer
function calculateSellingPrice(
  regularPrice = 0,
  productOffer = 0,
  categoryOffer = 0,
  brandOffer = 0
) {
  console.log(
    "prices from calculate function : ",
    regularPrice,
    productOffer,
    categoryOffer,
    brandOffer
  );
  let sellingPrice = regularPrice || 0;
  sellingPrice -=
    sellingPrice * (Math.max(productOffer, brandOffer, categoryOffer) / 100);
  console.log("Big offer: ", Math.max(productOffer, brandOffer, categoryOffer));

  // document.getElementById('sellingPrice').value = sellingPrice.toFixed(2);
  return sellingPrice.toFixed(2);
}

//function for specification
function addSpecification() {
  const specContainer = document.getElementById("specifications");
  const newSpec = document.createElement("div");
  newSpec.classList.add(
    "specification-container",
    "card-body",
    "p-3",
    "mb-3",
    "fade-in"
  );
  newSpec.innerHTML = `
        <div class="row g-3">
            <div class="col-md-5">
                <input type="text" class="form-control" name="specKey[]" placeholder="Specification Key" required>
            </div>
            <div class="col-md-5">
                <input type="text" class="form-control" name="specValue[]" placeholder="Specification Value" required>
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-outline-danger w-100" onclick="removeSpecification(this)">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `;
  specContainer.appendChild(newSpec);
}

function removeSpecification(button) {
  const specContainer = button.closest(".specification-container");
  specContainer.style.opacity = "0";
  specContainer.style.transform = "translateY(20px)";
  setTimeout(() => {
    specContainer.remove();
  }, 300);
}

let cropper = null;
let currentImageItem = null;
const MAX_IMAGES = 5;
const cropperModal = document.getElementById("cropperModal");
const cropperImage = document.getElementById("cropperImage");
const imagesContainer = document.getElementById("imagesContainer");
const form = document.getElementById("productForm");
const imageInput = document.getElementById("imageInput");
const loading = document.getElementById("loading");
const processedImages = new Map(); // Store processed images

// tags
const tags = new Set();
const tagContainer = document.getElementById("tagContainer");
const tagInput = document.getElementById("tagInput");
const hiddenTags = document.getElementById("hiddenTags");

//function for creating tag
function createTag(tagText) {
  const tag = document.createElement("span");
  tag.className = "tag";
  tag.innerHTML = `
        ${tagText}
        <button type="button" onclick="removeTag('${tagText}')">&times;</button>
    `;
  return tag;
}
// function for adding that tag
function addTag() {
  const tagText = tagInput.value.trim();
  if (tagText && !tags.has(tagText)) {
    tags.add(tagText);
    tagContainer.appendChild(createTag(tagText));
    tagInput.value = "";
    updateHiddenInput();
  }
}
//function for removing the tag
function removeTag(tagText) {
  tags.delete(tagText);
  renderTags();
  updateHiddenInput();
}
// function for rendering the tag
function renderTags() {
  tagContainer.innerHTML = "";
  tags.forEach((tag) => {
    tagContainer.appendChild(createTag(tag));
  });
}
// function for updating hidden input
function updateHiddenInput() {
  hiddenTags.value = Array.from(tags).join(",");
}
// adding tags to the formdata
function appendTagsToFormData(formData) {
  // As JSON
  formData.append("tags", JSON.stringify(Array.from(tags)));

  return formData;
}

// function for clearing all tags
function clearAllTags() {
  tags.clear(); // Clear the Set of tags
  tagContainer.innerHTML = ""; // Clear the visual display
  hiddenTags.value = ""; // Clear the hidden input
  tagInput.value = ""; // Clear the input field
}

// adding a event listener to add Tag on enter click
tagInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addTag();
  }
});

// Cropper functionality
// Handle image selection
imageInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files);
  if (processedImages.size + files.length > MAX_IMAGES) {
    // alert(`You can only upload up to ${MAX_IMAGES} images`);
    Swal.fire({
      title: "Sweet!",
      text: `You can only upload up to ${MAX_IMAGES} images`,
      icon: "error",
      confirmButtonText: "ok",
    });

    return;
  }

  files.forEach((file) => {
    if (file.type.startsWith("image/")) {
      createImagePreview(file);
    }
  });

  imageInput.value = ""; // Reset input
});

function createImagePreview(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const imageItem = document.createElement("div");
    imageItem.className = "image-item";
    const id = "image-" + Date.now();

    imageItem.innerHTML = `
            <div class="preview-container">
                <img src="${e.target.result}" class="preview-image" id="${id}-preview" alt="Preview">
            </div>
            <div class="button-group">
                <button type="button" class="crop-btn" onclick="openCropper('${id}')">Edit</button>
                <button type="button" class="remove-btn" onclick="removeImage('${id}')">Remove</button>
            </div>
        `;

    imagesContainer.appendChild(imageItem);
    processedImages.set(id, {
      element: imageItem,
      originalFile: file,
      cropped: null,
      isCropped: false, // New flag to track if image was cropped
    });
  };
  reader.readAsDataURL(file);
}

function openCropper(id) {
  const preview = document.getElementById(`${id}-preview`);
  cropperImage.src = preview.src;
  cropperModal.style.display = "block";
  currentImageItem = id;

  if (cropper) {
    cropper.destroy();
  }

  cropper = new Cropper(cropperImage, {
    aspectRatio: 1,
    viewMode: 0,
    background: false,
  });
}

document.getElementById("cropBtn").addEventListener("click", async () => {
  if (cropper && currentImageItem) {
    const canvas = cropper.getCroppedCanvas();
    const preview = document.getElementById(`${currentImageItem}-preview`);
    preview.src = canvas.toDataURL("image/jpeg");

    // Convert canvas to blob and store it
    const blob = await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.8);
    });

    // Store cropped image
    const imageInfo = processedImages.get(currentImageItem);
    if (imageInfo) {
      imageInfo.cropped = blob;
      imageInfo.isCropped = true; // Mark as cropped
    }
  }
  closeCropper();
});

document
  .getElementById("cancelCropBtn")
  .addEventListener("click", closeCropper);

function closeCropper() {
  cropperModal.style.display = "none";
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  currentImageItem = null;
}

function removeImage(id) {
  processedImages.get(id).element.remove();
  processedImages.delete(id);
}

// Form validation and submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  loading.style.display = "block";
  // adding all specification to a object
  const specKeys = Array.from(
    document.querySelectorAll('input[name="specKey[]"]')
  ).map((input) => input.value);
  const specValues = Array.from(
    document.querySelectorAll('input[name="specValue[]"]')
  ).map((input) => input.value);
  const specifications = {};
  specKeys.forEach((key, index) => {
    specifications[key] = specValues[index];
  });
  console.log(specifications); // testing

  try {
    const formData = new FormData();
    formData.append("name", document.getElementById("name").value);
    formData.append("offer", document.getElementById("offer").value);
    formData.append(
      "description",
      document.getElementById("description").value
    );
    formData.append("category", document.getElementById("category").value);
    formData.append("brand", document.getElementById("Brand").value);
    formData.append(
      "regularPrice",
      document.getElementById("regularPrice").value
    );
    formData.append(
      "sellingPrice",
      document.getElementById("sellingPrice").value
    );
    formData.append("quantity", document.getElementById("quantity").value);
    formData.append("specifications", JSON.stringify(specifications));

    // Get selected colors
    const colorSelect = document.getElementById("color");
    const selectedColors = Array.from(colorSelect.selectedOptions).map(
      (option) => option.value
    );
    formData.append("colors", JSON.stringify(selectedColors));

    // Process size input - split by commas and trim whitespace
    const sizeInput = document.getElementById("size").value;
    // const sizes = sizeInput.split(',').map(size => size.trim()).filter(size => size !== '');
    formData.append("sizes", JSON.stringify(sizeInput));

    formData.append("status", document.getElementById("status").value);

    // Add images
    let imageIndex = 0;
    for (const [_, imageInfo] of processedImages) {
      // Use cropped image if available, otherwise use original
      const imageBlob = imageInfo.isCropped
        ? imageInfo.cropped
        : imageInfo.originalFile;
      const fileName = `image-${imageIndex + 1}.jpg`;
      formData.append(`images`, imageBlob, fileName);
      imageIndex++;
    }

    // Log the FormData contents for debugging
    for (let pair of formData.entries()) {
      console.log(pair[0] + ": " + pair[1]);
    }

    // calling the function for adding the tags to the form data
    appendTagsToFormData(formData);

    const response = await fetch("/admin/products/addProducts", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      // alert('Product created successfully!');
      Swal.fire({
        title: "Sweet!",
        text: "Product created successfully!",
        icon: "success",
        confirmButtonText: "Cool",
      });

      form.reset();
      imagesContainer.innerHTML = "";
      processedImages.clear();
      window.location.href = "/admin/products";
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create product");
    }
  } catch (error) {
    // alert('Error creating product: ' + error.message);
    Swal.fire({
      title: "Sweet!",
      text: `Error creating product:${error.message}`,
      icon: "error",
      confirmButtonText: "Ok",
    });

    console.log(error.message);
  } finally {
    loading.style.display = "none";
  }
});


function validateForm() {
  let isValid = true;

  // Reset all errors
  document.querySelectorAll(".error").forEach((error) => {
    error.style.display = "none";
  });

  // Validate required fields
  const name = document.getElementById("name").value;
  if (!name.trim()) {
    document.getElementById("nameError").style.display = "block";
    isValid = false;
  }

  const offer = document.getElementById("offer").value;
  // if (!offer || offer <= 0) {
  //     document.getElementById('offerError').style.display = 'block';
  //     isValid = false;
  // }

  const description = document.getElementById("description").value;
  if (!description.trim()) {
    document.getElementById("descriptionError").style.display = "block";
    isValid = false;
  }

  const category = document.getElementById("category").value;
  if (!category) {
    document.getElementById("categoryError").style.display = "block";
    isValid = false;
  }
  const Brand = document.getElementById("Brand").value;
  if (!category) {
    document.getElementById("brandError").style.display = "block";
    isValid = false;
  }

  // Validate images
  if (processedImages.size === 0) {
    document.getElementById("imagesError").style.display = "block";
    isValid = false;
  }
  // New validation rules
  const regularPrice = document.getElementById("regularPrice").value;
  if (!regularPrice || regularPrice <= 0) {
    document.getElementById("regularPriceError").style.display = "block";
    isValid = false;
  }

  const sellingPrice = document.getElementById("sellingPrice").value;
  if (!sellingPrice || sellingPrice <= 0) {
    document.getElementById("sellingPriceError").style.display = "block";
    isValid = false;
  }

  const quantity = document.getElementById("quantity").value;
  if (!quantity || quantity < 0) {
    document.getElementById("quantityError").style.display = "block";
    isValid = false;
  }

  const status = document.getElementById("status").value;
  if (!status) {
    document.getElementById("statusError").style.display = "block";
    isValid = false;
  }
  const sizeInput = document.getElementById("size").value;
  if (!sizeInput) {
    document.getElementById("sizeError").style.display = "block";
    isValid = false;
  }

  return isValid;
}


// handling cancel event

document.getElementById("cancel").addEventListener("click", (e) => {
  e.preventDefault();
  Swal.fire({
    title: "Are you sure?",
    text: "Changes will not be saved!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, cancel!",
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = "/admin/products";
    }
  });
});