const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("keydown", function (e) {
  // e.preventDefault();
  if (e.key === "Enter") {
    {
      window.location.href = `/user/store?search=${searchInput.value}`;
    }
  }
});
