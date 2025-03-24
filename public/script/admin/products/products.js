// for deleting a product
function deleteResource(url) {
  if (confirm("Are you sure do you want to delete this product? !!!!!")) {
    if (confirm("Are you sure you want to delete this product?")) {
      fetch(url, { method: "DELETE" })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            location.reload();
          } else {
            alert("Failed to delete product" + data.message);
          }
        })
        .catch((err) => console.log(err));
    }
  }
}
//end
// for changing the product status
function changeProductStatus(productId, status) {
  fetch(`/admin/products/changeProductStatus/${productId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: status }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        location.reload();
      } else {
        alert("Failed to change product status" + data.message);
      }
    })
    .catch((err) => console.log(err));
}
//end

// function for unblocking product
function unblockProduct(productId) {
  fetch(`/admin/products/unblockProduct/${productId}`, {
    method: "PATCH",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        location.reload();
      } else {
        alert("Failed to unblock product" + data.message);
      }
    })
    .catch((err) => console.log(err));
}
// end
// function for blocking product
function blockProduct(productId) {
  fetch(`/admin/products/blockProduct/${productId}`, {
    method: "PATCH",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        location.reload();
      } else {
        alert("Failed to block product" + data.message);
      }
    })
    .catch((err) => console.log(err));
}
// end
